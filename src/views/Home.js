import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AppState, TextInput } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

import geolib from 'geolib';
import colorScale from '../../assets/styles/color-scale';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCowMv70Xw6rAuBGwTToIm7GHBXagouUXA';
const RADIUS_SIZE = 500;

export default class HomeView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            location: {
                latitude: 0,
                longitude: 0
            },
            mapLocation: {
                latitude: 0,
                longitude: 0
            },
            isLoading: true,
            isFetching: true,
            appState: AppState.currentState,
            inDanger: false,
            destination: ''
        };

        this.watchID = undefined;

        this.crimeData = [];
    }

    async getLocation() {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    console.log('Position found!', position);
                    resolve(position);
                },
                (error) => {
                    // See error code charts below.
                    console.log(error.code, error.message);
                    reject(error.message);
                },
                { enableHighAccuracy: true, timeout: 1000 * 5, maximumAge: 10000 }
            );
        });
    }

    componentDidMount() {
        //PushNotificationIOS.requestPermissions();
        AppState.addEventListener('change', this.handleAppStateChange);

        fetch('https://sharky.cool/api/tamuhack/data').then(resp => {
            resp.json().then(json => this.crimeData = json);
            this.setState({
                isFetching: false
            });
        }).catch(err => {
            console.log(err);
        });

        Geolocation.getCurrentPosition(
            (position) => {
                console.log('Position found!', position);
                this.setState({
                    isLoading: false,
                    mapLocation: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121
                    },
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                });
            },
            (error) => {
                // See error code charts below.
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        this.watchID = setInterval(() => {
            this.getLocation().then(position => {
                this.setState({
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                });

                //flag indicating if we are close to a crime spot
                let nearDanger = this.crimeData.find(data => {
                    // Filter out crimes with no injuries or casualities.
                    if (data.killed == 0 && data.injured == 0) return false;
                    return geolib.getDistance(
                        this.state.location,
                        {latitude: data.latitude, longitude: data.longitude}
                    ) < RADIUS_SIZE;
                });

                if (nearDanger && !this.state.inDanger) {
                    this.setState({
                        inDanger: true
                    });
                } else if (this.state.inDanger) {
                    this.setState({
                        inDanger: false
                    });
                }
            });
        }, 1000 * 5);
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
        clearInterval(this.watchID);
    }

    handleAppStateChange = (nextAppState) => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            console.log('App has come to the foreground!');
        }
        console.log(nextAppState);
        this.setState({appState: nextAppState});
    };

    render() {
        if (this.state.isLoading || this.state.isFetching) {
            return (
                <View style={styles.containerCenter}>
                    <Text>Breaking everything, please wait...</Text>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <TextInput
			placeholder="Input Destination..."
                        style={styles.input}
			onChangeText={(destination) => this.setState({destination})}
                        value={this.state.destination}
                    />
                </View>
                <View style={[styles.container, {borderWidth: 10, borderColor: this.state.inDanger ? 'red': 'green'}]}>
                <TouchableOpacity activeOpacity={0.7} style={[styles.button, {bottom: -120, right: -95}]}
                    onPress={() => {
                        this.setState({
                            mapLocation: {
                                latitude: this.state.location.latitude,
                                longitude: this.state.location.longitude,
                                latitudeDelta: this.state.mapLocation.latitudeDelta,
                                longitudeDelta: this.state.mapLocation.longitudeDelta
                            }
                        })
                    }}
                >
                <Text>CENTER</Text>
                </TouchableOpacity>
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={{
                        latitude: this.state.mapLocation.latitude,
                        longitude: this.state.mapLocation.longitude,
                        latitudeDelta: this.state.mapLocation.latitudeDelta,
                        longitudeDelta: this.state.mapLocation.longitudeDelta
                    }}
                    onRegionChange={location => {
                        this.state.mapLocation = location;
                    }}
                >
                    <MapViewDirections
                        origin={this.state.location}
                        destination={this.state.destination}
                        apikey={GOOGLE_MAPS_APIKEY}
                        strokeWidth={5}
                        strokeColor='#4E9BDC'
                    />
                    <Marker
                        coordinate={{
                            latitude: this.state.location.latitude,
                            longitude: this.state.location.longitude,
                        }}
                    />
                    <Circle
                        center={{
                            latitude: this.state.location.latitude,
                            longitude: this.state.location.longitude
                        }}
                        radius={250}
                        strokeWidth={0}
                        fillColor='rgba(61,153,112,0.5)'
                    />
                    {this.crimeData.map((data, index) => {
                        let ourLocation = this.state.mapLocation;

                        let crimeLat = data.latitude;
                        let crimeLong = data.longitude;

                        let parsedLat = parseFloat(crimeLat);
                        let parsedLong = parseFloat(crimeLong);

                        //ignore crime spots not in our vicinity
                        if (Math.abs(ourLocation.latitude - crimeLat) > 0.5
                            || Math.abs(ourLocation.longitude - crimeLong) > 0.5) {
                            return;
                        }

                        //ignore crime spots with no severity
                        if (data.injured == 0 && data.killed == 0) {
                            return;
                        }
                        
                        //show relative severity of data points using heatmap color scale
                        let color = colorScale(data.weight);

                        return (
                            <View key={index}>
                                <Marker
                                    coordinate={{
                                        latitude: parsedLat,
                                        longitude: parsedLong,
                                    }}
                                    pinColor='#FF851B'
                                    title={`Lat: ${crimeLat}, Long: ${crimeLong}`}
                                    description={`Injured: ${data.injured}\nKilled: ${data.killed}`}
                                />
                                <Circle
                                    center={{
                                        latitude: parsedLat,
                                        longitude: parsedLong
                                    }}
                                    radius={RADIUS_SIZE}
                                    strokeWidth={0}
                                    fillColor={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`}
                                />
                            </View>
                        );
                    })}
                </MapView>
            </View>
            </View>  
        );
    }
}

const styles = StyleSheet.create({
    containerCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    button: {
        position: 'absolute',
        zIndex: 99,
        width: 250,
        height: 250,
        borderRadius: 100,
        paddingLeft: 50,
        paddingTop: 60,
        backgroundColor: 'white'
    },
    inputContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'white',
        zIndex: 99
    },
    input: {
        paddingLeft: 10,
        position: 'absolute',
        height: 50,
        left: 10,
        right: 10,
        bottom: 10,
        borderColor: 'lightgray',
        borderWidth: 2,
        borderRadius: 5
    }
});

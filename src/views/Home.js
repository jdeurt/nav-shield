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
            destination: 'Longhorn Tavern Stakehouse'
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
                let near = this.crimeData.find(data => {
                    return geolib.getDistance(
                        this.state.location,
                        {latitude: data.latitude, longitude: data.longitude}
                    ) < RADIUS_SIZE;
                });

                //if near danger
                if (near) {
                    //if the frame sides are not red already, set them from green to red
                    if (!this.state.inDanger) {
                        this.state.setState(
                            {
                                inDanger: true
                            }
                        );
                    }
                }
                //not near danger
                else {
                    //if the frame sides are red, set them back to green
                    if (this.state.inDanger) {
                        this.state.setState(
                            {
                                inDanger: false
                            }
                        );
                    }
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
                        radius={100}
                        strokeWidth={0}
                        fillColor='rgba(61,153,112,0.5)'
                    />
                    {this.crimeData.map((data, i) => {
                        if (Math.abs(this.state.mapLocation.latitude - data.latitude) > 0.5 || Math.abs(this.state.mapLocation.longitude - data.longitude) > 0.5) return;
                        if (data.injured == 0 && data.killed == 0) return;
                        let color = colorScale(data.weight);
                        return (
                            <View key={i}>
                                <Marker
                                    coordinate={{
                                        latitude: parseFloat(data.latitude),
                                        longitude: parseFloat(data.longitude),
                                    }}
                                    pinColor='#FF851B'
                                    title={`Lat: ${data.latitude}, Long: ${data.longitude}`}
                                    description={`Injured: ${data.injured}\nKilled: ${data.killed}`}
                                />
                                <Circle
                                    center={{
                                        latitude: parseFloat(data.latitude),
                                        longitude: parseFloat(data.longitude)
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

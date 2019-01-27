import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, PushNotificationIOS, AppState } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

import geolib from 'geolib';
import colorScale from '../../assets/styles/color-scale';

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
            appState: AppState.currentState
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
        PushNotificationIOS.requestPermissions();
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
                    ) < 500;
                });

                if (near && this.state.appState.match(/inactive|background/)) {
                    PushNotificationIOS.checkPermissions(permissions => {
                        if (permissions.alert && permissions.badge && permissions.sound) {
                            PushNotificationIOS.presentLocalNotification({
                                alertBody: 'Now entering a known crime area.',
                                alertAction: 'Ok'
                            });
                        }
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
                <View style={[styles.containerCenter, {position: 'absolute', top: 50, left: 20, zIndex: 99, backgroundColor: 'white', padding: 10, borderRadius: 3}]}>
                    <Text>Long: {this.state.location.longitude}</Text>
                    <Text>Lat: {this.state.location.latitude}</Text>
                </View>
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
                                    radius={500}
                                    strokeWidth={0}
                                    fillColor={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`}
                                />
                            </View>
                        );
                    })}
                </MapView>
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
    }
});

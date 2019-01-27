import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-elements';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

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
            isLoading: true
        };

        this.watchID = undefined;
    }

    async getLocation() {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    console.log("Position found!", position);
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
        Geolocation.getCurrentPosition(
            (position) => {
                console.log("Position found!", position);
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
                })
            });
        }, 1000 * 5);
    }

    componentWillUnmount() {
        clearInterval(this.watchID);
    }

    /*
    centerMap() {
        this.refs.map.animateToRegion({
            latitude: this.state.location.latitude,
            longitude: this.state.location.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121
        });
    }
    */

    render() {
        if (this.state.isLoading) {
            return (
                <View style={styles.containerCenter}>
                    <Text>Loading...</Text>
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
                    onRegionChangeComplete={location => {
                        this.state.mapLocation = location;
                    }}
                >

                    <Marker
                        coordinate={{
                            latitude: this.state.location.latitude,
                            longitude: this.state.location.longitude,
                        }}
                    />
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

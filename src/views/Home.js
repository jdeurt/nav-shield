import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import GeolocationGMaps from 'react-native-geolocation-service';

export default class HomeView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            location: {
                latitude: 0,
                longitude: 0
            },
            isLoading: true
        };

        this.watchID = undefined;
    }

    componentDidMount() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.setState({
                    isLoading: false,
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                });
                console.log("Position found!", position);
            },
            (error) => {
                // See error code charts below.
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
        );
        this.watchID = navigator.geolocation.watchPosition(
            (position) => {
                this.setState({
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                });
                console.log("Position updated!", position);
            },
            (error) => {
                // See error code charts below.
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000, distanceFilter: 1 }
        );
    }

    componentWillUnmount() {
        navigator.geolocation.clearWatch(this.watchID);
    }

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
                    <View style={[styles.containerCenter, {position: 'absolute', top: 50, left: 20, zIndex: 99, backgroundColor: 'white', padding: 10}]}>
                        <Text>Long: {this.state.location.longitude}</Text>
                        <Text>Lat: {this.state.location.latitude}</Text>
                    </View>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        region={{
                            latitude: this.state.location.latitude,
                            longitude: this.state.location.longitude,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.0121,
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
    }
});

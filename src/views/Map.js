import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AppState, TextInput } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

import geolib from 'geolib';
import colorScale from '../../assets/styles/color-scale';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCowMv70Xw6rAuBGwTToIm7GHBXagouUXA';
const RADIUS_SIZE = 500;

export default class MapView extends React.Component {
    constructor(props) {
        super(props);
    }

    
}
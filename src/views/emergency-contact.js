import React, { Component } from 'react';
import {
	    ScrollView,
	    Text,
	    TextInput,
	    View,
	    Button
} from 'react-native';

export default class Contact extends Component {

	    render() {
		            return (
				                <ScrollView style={{padding: 20}}>
				                    <Text 
				                        style={{fontSize: 27}}>
				                        Login
				                    </Text>
				                    <TextInput placeholder='Phone Number' />
				                    <TextInput placeholder='Email Address' />
				                    <View style={{margin:7}} />
				                    <Button 
				                              onPress={this.props.onLoginPress}
				                              title="Submit"
				                          />
				                      </ScrollView>
				                )
		        }
}

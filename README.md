# nav-shield

The purpose of this app is to allow users to navigate safely through potentially dangerous areas. 
This is accomplished by using a Google Maps overlaid with a heatmap of gun violence incidents.

### Features
* Point A to Point B navigation via Google Maps API.
* Border changes color from green to red according to our custom calculated safety weighting of the area.
* Only plots points (from the Gun Violence Database) within current view to optimize speed.
* Input desired end point through the search bar at the top of the app.
* Center button to center the map on the user.

## Built With

* [React Native](https://github.com/facebook/react-native) - The JS Framework used to make Native Mobile apps.
* [Visual Studio Code](https://code.visualstudio.com/) - The IDE used for writing most of our JS Code.
* [Google Maps API](https://developers.google.com/maps/documentation/) - The API used for mapping our data and directing the user from their location to a desired Point B.
* [Auth0](https://auth0.com/) - Authenticator for our login page, used to retaining desired settings and direction history.
* [Vim](https://www.vim.org/) - The text editor used.
* [nav-shield-api](https://github.com/jdeurt/nav-shield-api) - Homemade API used to reference crime statistics. 

## Authors

* **Juan De Urtubey** - *Initial work, main app function, React Native wizard* - [jdeurt](https://github.com/jdeurt)
* **Will Zhao** - *Code optimization, heat map function, logic kind* - [VisionZ](https://github.com/VisionZ)
* **Cameron Brill** - *Auth0 authentication, Login Page, Twilio notifier* - [gaiscioch](https://github.com/gaiscioch)
* **William Deng** - *Debugger, Cheif Data Scientist, found the anomoly that is the "Eye of China"* - [wdeng112](https://github.com/wdeng112)

## Acknowledgments

* The Internet is your friend :)
* Code > Sleep
* Congrats to the rest of the TAMU Hack 2019 contestants for their valiant efforts!

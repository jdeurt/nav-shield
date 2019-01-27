// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTPushNotificationManager.h>

#import "AppDelegate.h"

@import GoogleMaps; //add this line if you want to use Google Maps

@implementation AppDelegate

// Put your app delegate methods here. Remember to also call methods from EXStandaloneAppDelegate superclass
// in order to keep Expo working. See example below.

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"AIzaSyCowMv70Xw6rAuBGwTToIm7GHBXagouUXA"]; // add this line using the api key obtained from Google Console
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Required to register for notifications
 - (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
 {
  [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
 }
 // Required for the register event.
 - (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
 {
  [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
 }
 // Required for the notification event. You must call the completion handler after handling the remote notification.
 - (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
                                                        fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
 {
   [RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
 }
 // Required for the registrationError event.
 - (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
 {
  [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
 }
 // Required for the localNotification event.
 - (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
 {
  [RCTPushNotificationManager didReceiveLocalNotification:notification];
 }

#import <React/RCTLinkingManager.h>

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
	  return [RCTLinkingManager application:application openURL:url
		                        sourceApplication:sourceApplication annotation:annotation];
}

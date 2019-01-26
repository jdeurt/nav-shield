// Copyright 2015-present 650 Industries. All rights reserved.

#import "AppDelegate.h"

@implementation AppDelegate

// Put your app delegate methods here. Remember to also call methods from EXStandaloneAppDelegate superclass
// in order to keep Expo working. See example below.

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"_YOUR_API_KEY_"]; // add this line using the api key obtained from Google Console
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end

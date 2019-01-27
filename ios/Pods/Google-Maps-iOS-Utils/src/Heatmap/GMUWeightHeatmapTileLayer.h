#import <GoogleMaps/GoogleMaps.h>

#import "GMUGradient.h"
#import "GMUWeightedLatLng.h"

NS_ASSUME_NONNULL_BEGIN

@interface GMUWeightHeatmapTileLayer : GMSSyncTileLayer

@property(nonatomic, copy) NSArray<GMUWeightedLatLng *> *weightedData;
@property(nonatomic) NSUInteger radius;
@property(nonatomic) GMUGradient *gradient;
@property(nonatomic) CGFloat staticMaxIntensity;
@property(nonatomic) CGFloat gradientSmoothing;

@end

NS_ASSUME_NONNULL_END

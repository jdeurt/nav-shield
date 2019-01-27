//
//  GMUWeightHeatmapTileLayer.m
//  DevApp
//
//  Created by Admin on 20/01/2018.
//  Copyright © 2018 Google. All rights reserved.
//

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif


#import "GMUWeightHeatmapTileLayer.h"

#import "GQTBounds.h"
#import "GQTPointQuadTree.h"

static const int kGMUMaxZoom = 22;
static const int kGMUMinZoomIntensity = 5;
static const int kGMUMaxZoomIntensity = 10;

static const int DEFAULT_RADIUS = 20;
static const double DEFAULT_OPACITY = 0.7;
static const int TILE_DIM = 512;

static void FreeDataProviderData(void *info, const void *data, size_t size) { free((void *)data); }

@interface GMUWeightHeatmapTileCreationData : NSObject {
@public
    GQTPointQuadTree *_quadTree;
    GQTBounds _bounds;
    NSUInteger _radius;
    NSArray<UIColor *> *_colorMap;
    NSArray<NSNumber *> *_maxIntensities;
    CGFloat _staticMaxIntensity;
    CGFloat _gradientSmoothing;
}
@end

@implementation GMUWeightHeatmapTileCreationData
@end

@interface HeatmapPoint : NSObject {
@public
    CGFloat _intensity;
    CGFloat _weight;
}
@end

@implementation HeatmapPoint
@end

@implementation GMUWeightHeatmapTileLayer {
    BOOL _dirty;
    GMUWeightHeatmapTileCreationData *_data;
}

- (instancetype)init {
    if ((self = [super init])) {
        _radius = DEFAULT_RADIUS;
        NSArray<UIColor *> *DEFAULT_GRADIENT_COLORS = @[
                                                        [UIColor colorWithRed:102.f / 255.f green:225.f / 255.f blue:0 alpha:1],
                                                        [UIColor colorWithRed:1.0f green:0 blue:0 alpha:1]
                                                        ];
        NSArray<NSNumber *> *DEFAULT_GRADIENT_START_POINTS = @[ @0.2f, @1.0f ];
        NSUInteger DEFAULT_COLOR_MAP_SIZE = 1000;
        _gradient = [[GMUGradient alloc] initWithColors:DEFAULT_GRADIENT_COLORS
                                            startPoints:DEFAULT_GRADIENT_START_POINTS
                                           colorMapSize:DEFAULT_COLOR_MAP_SIZE];
        _dirty = YES;
        _staticMaxIntensity = 0.0f;
        _gradientSmoothing = 0.0f;
        self.opacity = DEFAULT_OPACITY;
        self.tileSize = TILE_DIM;
    }
    return self;
}

- (void)setRadius:(NSUInteger)value {
    _radius = value;
    _dirty = YES;
}

- (void)setGradient:(GMUGradient *)gradient {
     UIColor *newObject = [[[gradient colors] firstObject]  colorWithAlphaComponent:0];
     NSMutableArray *colors = [[NSMutableArray alloc] initWithArray:gradient.colors];
     [colors removeObjectAtIndex:0];
     [colors insertObject:newObject atIndex:0];
     _gradient = [[GMUGradient alloc] initWithColors:colors
                                         startPoints:gradient.startPoints
                                        colorMapSize:gradient.mapSize];
    _dirty = YES;
}

- (void)setWeightedData:(NSArray<GMUWeightedLatLng *> *)weightedData {
    _weightedData = [weightedData copy];
    _dirty = YES;
}

- (void)setStaticMaxIntensity:(CGFloat)staticMaxIntensity {
    _staticMaxIntensity = staticMaxIntensity;
    _dirty = YES;
}

- (void)setMap:(GMSMapView *)map {
    if (_dirty) {
        [self prepare];
        _dirty = NO;
    }
    [super setMap:map];
}

- (GQTBounds)calculateBounds {
    GQTBounds result;
    result.minX = 0;
    result.minY = 0;
    result.maxX = 0;
    result.maxY = 0;
    if (_weightedData.count == 0) {
        return result;
    }
    GQTPoint point = [_weightedData[0] point];
    result.minX = result.maxX = point.x;
    result.minY = result.maxY = point.y;
    for (int i = 1; i < _weightedData.count; i++) {
        point = [_weightedData[i] point];
        if (result.minX > point.x) result.minX = point.x;
        if (result.maxX < point.x) result.maxX = point.x;
        if (result.minY > point.y) result.minY = point.y;
        if (result.maxY < point.y) result.maxY = point.y;
    }
    return result;
}

- (NSNumber *)maxValueForZoom:(int)zoom {
    double magicalFactor = 0.5;
    double bucketSize = _radius / 128.0 / pow(2, zoom) * magicalFactor;
    NSMutableDictionary<NSNumber *, NSMutableDictionary<NSNumber *, NSNumber *> *> *lookupX =
    [NSMutableDictionary dictionary];
    float max = 0;
    for (GMUWeightedLatLng *dataPoint in _weightedData) {
        GQTPoint point = [dataPoint point];
        NSNumber *xBucket = @((int)((point.x + 1) / bucketSize));
        NSNumber *yBucket = @((int)((point.y + 1) / bucketSize));
        NSMutableDictionary<NSNumber *, NSNumber *> *lookupY = lookupX[xBucket];
        if (!lookupY) {
            lookupY = [NSMutableDictionary dictionary];
            lookupX[xBucket] = lookupY;
        }
        NSNumber *value = lookupY[yBucket];
        float newValue = [value floatValue] + dataPoint.intensity;
        if (newValue > max) max = newValue;
        lookupY[yBucket] = @(newValue);
    }
    return @(max);
}

- (NSArray<NSNumber *> *)calculateIntensities {
    // TODO: extract constants;
    NSMutableArray<NSNumber *> *intensities = [NSMutableArray arrayWithCapacity:kGMUMaxZoom];
    // Populate the array up to the min intensity with place holders until the min intensity is
    // calculated.
    for (int i = 0; i < kGMUMinZoomIntensity; i++) {
        intensities[i] = @0;
    }
    for (int i = kGMUMinZoomIntensity; i <= kGMUMaxZoomIntensity; i++) {
        intensities[i] = [self maxValueForZoom:i];
    }
    for (int i = 0; i < kGMUMinZoomIntensity; i++) {
        intensities[i] = intensities[kGMUMinZoomIntensity];
    }
    for (int i = kGMUMaxZoomIntensity + 1; i < kGMUMaxZoom; i++) {
        intensities[i] = intensities[kGMUMaxZoomIntensity];
    }
    return intensities;
}

- (CGFloat)calculateIntensityForDistance:(CGFloat)distance {
    return expf((-distance * distance) / (_radius/3 * _radius/3 * 2));
}

- (CGFloat)calculateDistanceForX1:(int)x1 y1:(int)y1 x2:(int)x2 y2:(int)y2 {
    int dx = x1 - x2;
    int dy = y1 - y2;
    return sqrtf((dx * dx) + (dy * dy));
}

- (CGFloat)weightedAverageForPoint1Weight:(float)pointWeight1 pointWeight2:(float)pointWeight2 pointIntensity1:(float)pointIntensity1 pointIntensity2:(float)pointIntensity2 {
    return ((pointIntensity1 * pointWeight1) + (pointIntensity2 * pointWeight2)) / (pointIntensity1 + pointIntensity2);
}

- (HeatmapPoint *)mergeHeatmapPoints:(HeatmapPoint *)heatmapPoint1 heatmapPoint2:(HeatmapPoint *)heatmapPoint2 {
    float newWeight = [self weightedAverageForPoint1Weight:heatmapPoint1->_weight pointWeight2:heatmapPoint2->_weight pointIntensity1:heatmapPoint1->_intensity pointIntensity2:heatmapPoint2->_intensity];
    float newIntensity = MAX(heatmapPoint1->_intensity, heatmapPoint2->_intensity);
    HeatmapPoint *newPoint = [[HeatmapPoint alloc] init];
    newPoint->_weight = newWeight;
    newPoint->_intensity = newIntensity;
    return newPoint;
}

- (void)prepare {
    GMUWeightHeatmapTileCreationData *data = [[GMUWeightHeatmapTileCreationData alloc] init];
    data->_bounds = [self calculateBounds];
    data->_quadTree = [[GQTPointQuadTree alloc] initWithBounds:data->_bounds];
    for (GMUWeightedLatLng *dataPoint in _weightedData) {
        [data->_quadTree add:dataPoint];
    }
    data->_colorMap = [_gradient generateColorMap];
    data->_maxIntensities = [self calculateIntensities];
    data->_radius = _radius;
    data->_staticMaxIntensity = _staticMaxIntensity;
    data->_gradientSmoothing = _gradientSmoothing;
    @synchronized(self) {
        _data = data;
    }
}

- (UIImage *)tileForX:(NSUInteger)x y:(NSUInteger)y zoom:(NSUInteger)zoom {
    GMUWeightHeatmapTileCreationData *data;
    @synchronized(self) {
        data = _data;
    }
    
    double tileWidth = 2.0 / pow(2.0, zoom);
    
    double minX = -1 + x * tileWidth;
    double minY = 1 - (y + 1) * tileWidth;
    
    double padding = data->_radius * tileWidth / TILE_DIM;
    
    double minXextended = -1 + x * tileWidth - padding;
    double maxXextended = -1 + (x + 1) * tileWidth + padding;
    double minYextended = 1 - (y + 1) * tileWidth - padding;
    double maxYextended = 1 - y * tileWidth + padding;
    
    GQTBounds tileExtendedBounds;
    tileExtendedBounds.minX = minXextended;
    tileExtendedBounds.maxX = maxXextended;
    tileExtendedBounds.minY = minYextended;
    tileExtendedBounds.maxY = maxYextended;
    
    NSArray<GMUWeightedLatLng *> *points = [data->_quadTree searchWithBounds:tileExtendedBounds];
    
    if (points.count == 0) {
        return kGMSTileLayerNoTile;
    }
    
    NSPointerArray *tileGrid = [NSPointerArray strongObjectsPointerArray];
    for(int i=0;i<TILE_DIM*TILE_DIM;i++) {
        [tileGrid insertPointer:nil atIndex:i];
    }
    
    int radius = (int)(data->_radius);
    int middle = radius - 1;
    
    for(GMUWeightedLatLng *point in points) {
        double pointWeight = [point intensity];
        
        int pointGridX = (([point point].x - minX) * TILE_DIM) / tileWidth;
        int pointGridY = (([point point].y - minY) * TILE_DIM) / tileWidth;
        
        int iStart = 0;
        int iEnd = 2 * radius;
        int jStart = 0;
        int jEnd = 2 * radius;
        
        if(pointGridX - radius < 0) {
            iStart = radius - pointGridX;
        }
        
        if(pointGridX + radius > TILE_DIM) {
            iEnd = radius - (pointGridX - TILE_DIM);
        }
        
        if(pointGridY - radius < 0) {
            jStart = radius - pointGridY;
        }
        
        if(pointGridY + radius > TILE_DIM) {
            jEnd = radius - (pointGridY - TILE_DIM);
        }
        
        for(int i = iStart; i < iEnd; i++) {
            for(int j = jStart; j < jEnd; j++) {
                double distanceToPoint = [self calculateDistanceForX1:i y1:j x2:middle y2:middle];
                double intensity = [self calculateIntensityForDistance:distanceToPoint];
                double weight = MAX((intensity * data->_gradientSmoothing) + (pointWeight - data->_gradientSmoothing), 1.0);
                
                int tileXIndex = (i - middle) + pointGridX - 1;
                int tileYIndex = (j - middle) + pointGridY - 1;
                
                if(intensity > 0.01) {
                    HeatmapPoint *newPoint = [[HeatmapPoint alloc] init];
                    newPoint->_intensity = intensity;
                    newPoint->_weight = weight;
                    
                    int tileGridIndex = tileXIndex * TILE_DIM + tileYIndex;
                    HeatmapPoint *possiblePoint = [tileGrid pointerAtIndex:tileGridIndex];
                    
                    if(possiblePoint != nil) {
                        [tileGrid replacePointerAtIndex:tileGridIndex withPointer:(__bridge void *)[self mergeHeatmapPoints:possiblePoint heatmapPoint2:newPoint]];
                    } else {
                        [tileGrid replacePointerAtIndex:tileGridIndex withPointer:(__bridge void *)newPoint];
                    }
                }
            }
        }
    }
    
    double maxValue;
    
    if(data->_staticMaxIntensity > 0) {
        maxValue = data->_staticMaxIntensity;
    } else {
        maxValue = [data->_maxIntensities[zoom] doubleValue];
    }
    
    
    UIColor* maxColor = [data->_colorMap objectAtIndex:[data->_colorMap count] - 1];
    double colorMapScaling = ([data->_colorMap count] - 1) / maxValue;
    int dim = TILE_DIM;
    
    uint32_t *rawpixels = malloc(4 * TILE_DIM * TILE_DIM);
    
    for (int y = dim - 1; y >= 0; y--) {
        for (int x = 0; x < dim; x++) {
            int tileGridIndex = x * TILE_DIM + y;
            HeatmapPoint* point = [tileGrid pointerAtIndex:tileGridIndex];
            int index = (dim - y - 1) * dim + x;
            
            if(point != nil) {
                int col = point->_weight * colorMapScaling;
                double transparency = point->_intensity;
                UIColor* chosenColor;
                if(col < [data->_colorMap count]) {
                    chosenColor = [[data->_colorMap objectAtIndex:col] colorWithAlphaComponent:transparency];
                } else {
                    chosenColor = [maxColor colorWithAlphaComponent:transparency];
                }
                
                CGFloat red, green, blue, alpha;
                
                [chosenColor getRed: &red
                           green: &green
                            blue: &blue
                           alpha: &alpha];
        
                rawpixels[index] = (((uint32_t)(alpha * 255)) << 24) + (((uint32_t)(blue * 255)) << 16) +
                (((uint32_t)(green * 255)) << 8) + ((uint32_t)(red * 255));
            } else {
                rawpixels[index] = 0;
            }
        }
    }

    CGDataProviderRef provider = CGDataProviderCreateWithData(NULL, rawpixels, TILE_DIM * TILE_DIM * 4, FreeDataProviderData);

    CGColorSpaceRef colorSpaceRef = CGColorSpaceCreateDeviceRGB();
    CGImageRef imageRef = CGImageCreate(TILE_DIM, TILE_DIM, 8, 32, 4 * TILE_DIM,
                                        colorSpaceRef, kCGBitmapByteOrder32Big | kCGImageAlphaLast,
                                        provider, NULL, NO, kCGRenderingIntentDefault);
    UIImage *newImage = [UIImage imageWithCGImage:imageRef];
    CGImageRelease(imageRef);
    CGColorSpaceRelease(colorSpaceRef);
    CGDataProviderRelease(provider);

    return newImage;
}

@end

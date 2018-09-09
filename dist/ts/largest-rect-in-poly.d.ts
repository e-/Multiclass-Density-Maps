/**
 Return the largest rectangle inside the given polygon.
 @param poly Array of x, y coordinates describing a polygon, in the order in which those points should be drawn.
 @param options Object describing options, including:
 angle Specifies the rotation of the polygon. An angle of zero means that
 the longer side of the polygon (the width) will be aligned with the x axis.
 An angle of +90 and/or -90 means that the longer side of the polygon (the width)
 will be aligned with the y axis. The parameter angle can be
 - a number between -90 and +90 specifying the angle of rotation of the polygon.
 - a string which is parsed to a number
 - an array of numbers, specifying the possible rotations of the polygon
 - unspecified, which means the polygon can have any possible angle
 aspectRatio The ratio between the width and the height of the rectangle,
 i.e. width/height. The parameter aspectRatio can be
 - a number
 - a string which is parsed to a number
 - an array of numbers, specifying the possible aspectRatios of the polygon
 maxAspectRatio Maximum aspect ratio (width/height). Default is 15.
 This should be used if the aspectRatio is not provided.
 nTries The number of randomly drawn points inside the polygon which
 the algorithm explores as possible center points of the maximal rectangle.
 Default value is 20.
 minWidth The minimum width of the rectangle. Default is 0.
 minHeight The minimum height of the rectangle. Default is 0.
 tolerance The simplification tolerance factor. Should be between 0 and 1.
 Default is 0.02. Larger tolerance corresponds to more extensive simplification.
 origin The center point of the rectangle. If specified, the rectangle is
 fixed at that point, otherwise the algorithm optimizes across all possible points.
 The parameter origin can be
 - a two dimensional array specifying the x and y coordinate of the origin
 - an array of two dimensional arrays specifying the the possible center points
 of the maximal rectangle.
 @return [rect, area, events] Array of result data, including:
 rect Object describing the result rectangle, including:
 cx Center X coordinate of the result rectangle
 cy Center Y coordinate of the result rectangle
 width Width of the result rectangle
 height Height of the result rectangle
 angle Angle of the rectangle's axis, in degrees
 area Total area of the result rectangle
 events Array of events that occurred while finding the rectangle
 */
export default function largestRectInPoly(poly: [number, number][], options?: any): (number | {
    cx: number;
    cy: number;
    width: number;
    height: number;
    angle: any;
} | ({
    type: string;
    poly: [number, number][];
    points?: undefined;
    angle?: undefined;
    idx?: undefined;
    p1W?: undefined;
    p2W?: undefined;
    p1H?: undefined;
    p2H?: undefined;
    modifOrigins?: undefined;
    cx?: undefined;
    cy?: undefined;
    aRatio?: undefined;
    width?: undefined;
    height?: undefined;
    areaFraction?: undefined;
    insidePoly?: undefined;
} | {
    type: string;
    points: any;
    poly?: undefined;
    angle?: undefined;
    idx?: undefined;
    p1W?: undefined;
    p2W?: undefined;
    p1H?: undefined;
    p2H?: undefined;
    modifOrigins?: undefined;
    cx?: undefined;
    cy?: undefined;
    aRatio?: undefined;
    width?: undefined;
    height?: undefined;
    areaFraction?: undefined;
    insidePoly?: undefined;
} | {
    type: string;
    angle: any;
    poly?: undefined;
    points?: undefined;
    idx?: undefined;
    p1W?: undefined;
    p2W?: undefined;
    p1H?: undefined;
    p2H?: undefined;
    modifOrigins?: undefined;
    cx?: undefined;
    cy?: undefined;
    aRatio?: undefined;
    width?: undefined;
    height?: undefined;
    areaFraction?: undefined;
    insidePoly?: undefined;
} | {
    type: string;
    idx: number;
    p1W: [number, number] | null;
    p2W: [number, number] | null;
    p1H: [number, number] | null;
    p2H: [number, number] | null;
    modifOrigins: [number, number][];
    poly?: undefined;
    points?: undefined;
    angle?: undefined;
    cx?: undefined;
    cy?: undefined;
    aRatio?: undefined;
    width?: undefined;
    height?: undefined;
    areaFraction?: undefined;
    insidePoly?: undefined;
} | {
    type: string;
    cx: number;
    cy: number;
    poly?: undefined;
    points?: undefined;
    angle?: undefined;
    idx?: undefined;
    p1W?: undefined;
    p2W?: undefined;
    p1H?: undefined;
    p2H?: undefined;
    modifOrigins?: undefined;
    aRatio?: undefined;
    width?: undefined;
    height?: undefined;
    areaFraction?: undefined;
    insidePoly?: undefined;
} | {
    type: string;
    aRatio: any;
    poly?: undefined;
    points?: undefined;
    angle?: undefined;
    idx?: undefined;
    p1W?: undefined;
    p2W?: undefined;
    p1H?: undefined;
    p2H?: undefined;
    modifOrigins?: undefined;
    cx?: undefined;
    cy?: undefined;
    width?: undefined;
    height?: undefined;
    areaFraction?: undefined;
    insidePoly?: undefined;
} | {
    type: string;
    cx: number;
    cy: number;
    width: number;
    height: number;
    areaFraction: number;
    angle: any;
    insidePoly: boolean;
    poly?: undefined;
    points?: undefined;
    idx?: undefined;
    p1W?: undefined;
    p2W?: undefined;
    p1H?: undefined;
    p2H?: undefined;
    modifOrigins?: undefined;
    aRatio?: undefined;
})[] | null)[] | null;

import Color from './color';
import Mask from './mask';
import DataBuffer from './data-buffer';
import * as Scale from './scale';
import { ContourMultiPolygon } from 'd3-contour';
export default class DerivedBuffer {
    originalDataBuffer: DataBuffer;
    mask?: Mask;
    colorScale: Scale.ColorScale;
    color: Color;
    angle: number;
    constructor(originalDataBuffer: DataBuffer);
    thresholds(n: number): number[];
    contours(thresholds: number[], blur?: number): ContourMultiPolygon[];
}

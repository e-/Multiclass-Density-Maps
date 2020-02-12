import Color from './color';
import Mask from './mask';
import DataBuffer from './data-buffer';
import * as Scale from './scale';
import { ContourMultiPolygon } from 'd3-contour';
export default class ClassBuffer {
    dataBuffer: DataBuffer;
    mask?: Mask;
    colorScale: Scale.ColorScale;
    color0: Color;
    color1: Color;
    angle: number;
    name: string;
    constructor(dataBuffer: DataBuffer);
    thresholds(n: number): number[];
    contours(thresholds: number[], blur?: number): ContourMultiPolygon[];
}

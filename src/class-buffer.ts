import Color from './color';
import Mask from './mask';
import DataBuffer from './data-buffer';
import * as util from './util';
import * as Scale from './scale';
import { ContourMultiPolygon } from 'd3-contour';

export default class ClassBuffer {
    mask?: Mask;

    colorScale: Scale.ColorScale = new Scale.LinearColorScale([0, 1], [Color.White, Color.Black]);

    color0: Color = Color.None;
    color1: Color = Color.None;
    angle: number = 0;
    name: string;

    constructor(public dataBuffer: DataBuffer) {
        this.name = dataBuffer.name;
    }

    thresholds(n: number) {
        if (n <= 0) return [];
        let scaleTrait = this.colorScale.interpolator;
        return util.arange(scaleTrait.range[0],
            scaleTrait.range[1],
            (scaleTrait.range[1] - scaleTrait.range[0]) / (n + 2))
            .slice(1, n + 1)
            .map(v => scaleTrait.invmap(v));
    }

    contours(thresholds: number[], blur: number = 3) {
        return this.dataBuffer.contours(thresholds, blur);
    }
}

import Color from './color';
import Mask from './mask';
import DataBuffer from './data-buffer';
import * as util from './util';
import * as Scale from './scale';

export default class DerivedBuffer {
    // color:Color = new Color();
    mask?:Mask;

    colorScale:Scale.ColorScale = new Scale.LinearColorScale([0, 1], [Color.White, Color.Black]);
    color?:Color;
    angle?:number;

    constructor(public originalDataBuffer:DataBuffer) {
    }

    thresholds(n:number) {
        if (n <= 0) return [];
        let scaleTrait = this.colorScale.interpolator;
        return util.arange(scaleTrait.range[0],
                           scaleTrait.range[1],
                           (scaleTrait.range[1]-scaleTrait.range[0])/(n+2))
                   .slice(1, n+1)
                   .map(v => scaleTrait.invmap(v));
    }

    contours(thresholds:number[], blur:number = 3):any {
        return this.originalDataBuffer.contours(thresholds, blur);
    }

    blur( blur:number = 3): DerivedBuffer {
        if (blur == 0) return this;
        let blurred:DataBuffer    = this.originalDataBuffer.blur(blur);
        let derivedBlurred        = new DerivedBuffer(blurred);
        derivedBlurred.mask       = this.mask;
        derivedBlurred.colorScale = this.colorScale;
        derivedBlurred.color      = this.color;
        derivedBlurred.angle      = this.angle;

        return derivedBlurred;
    }
}

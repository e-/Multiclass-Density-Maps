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

    constructor(public originalDataBuffer:DataBuffer) {
    }
}

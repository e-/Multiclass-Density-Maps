import Color from './color';
import Mask from './mask';
import DataBuffer from './data-buffer';
import * as util from './util';

export default class DerivedBuffer {
    color:Color = new Color();
    mask:Mask | null = null;

    constructor(public originalDataBuffer:DataBuffer) {
    }
}

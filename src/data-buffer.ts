import Color from './color';
import Mask from './mask';
import * as util from './util';

export default class DataBuffer {
    // construct a data buffer from a specification object
    static fromSpec(spec:any) {
        return new DataBuffer('example', 5, 5);
    }

    constructor(public name:string, public width:number, public height:number, public values:number[][] = util.create2D<number>(width, height, 0)) {
    }
}

import * as util from './util';

export default class Mask {
    path:Path2D = new Path2D();
    constructor(public width:number, public height:number,
                default_value:number = 1,
                public mask:number[][] = util.create2D<number>(width, height, default_value)) {
    }
}

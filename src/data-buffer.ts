import Color from './color';
import Mask from './mask';
import * as util from './util';
import GaussianBlur from './gaussian-blur';

export default class DataBuffer {
    // construct a data buffer from a specification object
    static fromSpec(spec:any) {
        return new DataBuffer('example', 5, 5);
    }

    constructor(public name:string, public width:number, public height:number, public values:number[][] = util.create2D<number>(width, height, 0)) {
    }

    blur(radius:number = 3): DataBuffer {
        // Linearize the array
        let source = Array.prototype.concat.apply(this.values[0],
                                                  this.values.slice(1)),
        target = new Array(this.width*this.height);
        GaussianBlur(source, target, this.width, this.height, radius);
        var new_array = Array(this.height);
        for (var i = 0; i < this.height; i++)
            new_array[i] = target.slice(i*this.width, (i+1)*this.width);
        return new DataBuffer(this.name, this.width, this.height, new_array);
    }
}

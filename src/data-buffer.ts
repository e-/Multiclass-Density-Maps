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
        if (radius==0) return this;
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

    makeContour(contourNumber:number = 12): DataBuffer {
        if (contourNumber==0) return this;

        let mini = util.amin(this.values.map(util.amin)),
            maxi = util.amax(this.values.map(util.amax)),
            bandsize = (maxi-mini)/contourNumber,
            ids = new DataBuffer(this.name, this.width, this.height);
        
        // compute ids first
        for (let y=0; y < this.height; y++) {
            let src = this.values[y],
                dst = ids.values[y];
            for (let x = 0; x < this.width; x++)
                dst[x] = Math.floor((src[x]-mini)/bandsize);
        }

        let ndb = new DataBuffer(this.name, this.width, this.height);
        for (let y=0; y < this.height-1; y++) {
            let dst = ndb.values[y],
                src = this.values[y],
                ids0 = ids.values[y],
                ids1 = ids.values[y+1];
            for (let x=0; x<this.width-1; x++) {
                if (ids0[x] != ids1[x] || ids0[x] != ids0[x+1])
                    dst[x] = src[x];
            }
        }

        return ndb;
    }
}

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

        let mini = this.values[0][0];
        let maxi = this.values[0][0];
        for (let y=0; y<this.height; y++)
          for (let x=0; x<this.width; x++){
            mini = Math.min(mini, this.values[y][x]);
            maxi = Math.max(maxi, this.values[y][x]);
          }

        let bandsize = (maxi-mini)/contourNumber;
        //console.log(mini+"-"+maxi);

        let ndb = new DataBuffer(this.name, this.width, this.height)

        for (let y=0; y<this.height-1; y++)
          for (let x=0; x<this.width-1; x++){
            let bandid  = Math.round(this.values[y][x]/bandsize);
            let bandidx = Math.round(this.values[y+1][x]/bandsize);
            let bandidy = Math.round(this.values[y][x+1]/bandsize);
            if (bandid!=bandidx || bandid!=bandidy )
              ndb.values[y][x] = this.values[y][x];
        }


        return ndb;
    }
}

import * as util from './util';
import {Path} from './path';
import * as rn from 'random-seed';

export default class Mask {
    path?:Path;
    private maskCanvas?:HTMLCanvasElement;
    mask:Uint8ClampedArray[];

    constructor(public width:number, public height:number,
                default_value:number = 1, buffer?:ArrayBuffer, offset:number = 0) {
        if (buffer === undefined)
            buffer = new ArrayBuffer(width*height);
        this.mask = Array<Uint8ClampedArray>(height);
        for (let i = 0; i < height; i++) {
            this.mask[i] = new Uint8ClampedArray(buffer, i*width + offset, width);
            if (default_value != undefined)
                this.mask[i].fill(default_value);
        }
    }

    rowcounts() {
        let reducer = (accumulator:number, currentValue:number) => accumulator + currentValue;
        let rowcounts = this.mask.map(row => row.reduce(reducer));
        for (let i = 1; i < rowcounts.length; i++)
            rowcounts[i] += rowcounts[i-1];
        return rowcounts;
    }

    area() {
        let rc = this.rowcounts();
        return rc[rc.length-1];
    }

    randomPoint(rowcounts?:number[]) {
        if (rowcounts === undefined)
            rowcounts = this.rowcounts();
        let rand = rn.create('JaeminFredPierreJean-Daniel');
        var pos = rand(rowcounts[rowcounts.length-1]);
        var r = 0;
        while (rowcounts[r] < pos) r++;
        if (r > 0)
            pos -= rowcounts[r-1];
        let row = this.mask[r];
        for (let c = 0; c < this.width; c++) {
            if (row[c]) pos--;
            if (pos==0)
                return [r, c];
        }
        throw new Error('Random point not found as expected');
    }

    //[jdf] For linearize and buffer to work, we need to store the offset in the class
    //buffer() { return this.mask[0].buffer; }

    // linearize():number[] {
    //     // Fool the type system of TS that prevents returning the Float32Array directly
    //     return <number[]><any>new Uint8ClampedArray(this.buffer(), this.width*this.height,
    //                                                 this.offset);
    // }
    getCanvas() {
        if (this.maskCanvas == undefined) {
            this.maskCanvas = <HTMLCanvasElement>document.createElement('canvas');
            this.maskCanvas.width  = this.width;
            this.maskCanvas.height = this.height;
        }
        return this.maskCanvas;
    }
  
    getPath() {
      if (this.path === undefined)
        this.path = new Path();
      return this.path;
    }

    copyFrom(ctx:CanvasRenderingContext2D) {
        let imageData = ctx.getImageData(0, 0, this.width, this.height);
        var i = 0;
        for (let r = 0; r < imageData.height; r++) {
            let row = this.mask[r];
            for (let c = 0; c < imageData.width; c++) {
                if (imageData.data[i] > 0){
                    row[c] = 1;
                }
                i += 4;
            }
        }
    }
}

import * as util from './util';
import {Path} from './path';

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

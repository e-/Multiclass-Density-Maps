import Color from './color';
import Mask from './mask';
import * as util from './util';

export default class DataBuffer {
    color:Color = new Color();
    mask:Mask | null = null;

    constructor(public name:string, public width:number, public height:number, public values:number[][] = util.create2D<number>(width, height, 0)) {
    }

    reset() {
      for(let i = 0; i < this.height; ++i) {
        for(let j = 0; j < this.width; ++j) {
          this.values[i][j] = 0;
        }
      }
      this.setMask(null);
    }

    setMask(mask:Mask|null): void {
        this.mask = mask;
    }
  }

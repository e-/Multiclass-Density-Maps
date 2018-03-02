import Color from './color';
import Mask from './mask';
import Tile from './tile';
import Rect from './rect';
import * as util from './util';

export default class Image {
    mask:Mask | null = null;
    constructor(public width:number, public height:number, public pixels:Color[][] = util.create2D<Color>(width, height, new Color())) {
    }

    setMask(m:Mask|null): void {
        this.mask = m;
    }

    fillByTile(color:Color, tile:Tile) {
      for(let r = tile.y; r < tile.y + tile.mask.height; r++) {
        if(r >= this.height) break;
        for(let c = tile.x; c < tile.x + tile.mask.width; c++) {
          if(c >= this.width) break;
            if(this.mask != null && r < this.mask.width && c < this.mask.height) {
                if (this.mask.mask[r][c] == 0) continue;
            }

          let v = tile.mask.mask[r - tile.y][c - tile.x];
          this.pixels[r][c] = color.darken(v);
        }
      }
    }

    fillByRect(color:Color, rect:Rect) {
      for(let r = rect.min.y; r < rect.max.y; r++) {
        if(r >= this.height) break;
        for(let c = rect.min.x; c < rect.max.x; c++) {
          if(c >= this.width) break;
          this.pixels[r][c] = color.clone();
        }
      }
    }
  }

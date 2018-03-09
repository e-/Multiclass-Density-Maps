import Color from './color';
import Mask from './mask';
import Tile from './tile';
import Rect from './rect';
import * as util from './util';
import DerivedBuffer from './derived-buffer';

export default class Image {
    imageCanvas:HTMLCanvasElement;

    constructor(public width:number, public height:number, public pixels:Color[][] = util.create2D<Color>(width, height, new Color())) {
        this.imageCanvas = <HTMLCanvasElement>document.createElement('canvas');
        this.imageCanvas.width  = width;
        this.imageCanvas.height = height;
    }

    fillByTile(color:Color, tile:Tile, mask?:Mask) {
        for(let r = Math.ceil(tile.y); r < tile.y + tile.mask.height; r++) {
            if(r >= this.height) break;
            for(let c = Math.ceil(tile.x); c < tile.x + tile.mask.width; c++) {
                if(c >= this.width) break;

                if(tile.mask && tile.mask.mask[r-Math.ceil(tile.y)][c-Math.ceil(tile.x)] == 0)
                  continue;

                if(mask && r < mask.height && c < mask.width && mask.mask[r][c] == 0)
                  continue;

                this.pixels[r][c] = color;
            }
        }
    }

    fillByTileDebug(color:Color, tile:Tile, mask?:Mask) {
        for(let r = Math.ceil(tile.y); r < tile.y + tile.mask.height; r++) {
            if(r >= this.height) break;
            for(let c = Math.ceil(tile.x); c < tile.x + tile.mask.width; c++) {
                if(c >= this.width) break;
                //if (c==r) console.log(c+": "+(c-Math.ceil(tile.x))+" => "+tile.mask.mask[r-Math.ceil(tile.y)][c-Math.ceil(tile.x)]);

                if(tile.mask && tile.mask.mask[r-Math.ceil(tile.y)][c-Math.ceil(tile.x)] == 0)
                  continue;

                if(mask && r < mask.height && c < mask.width && mask.mask[r][c] == 0)
                  continue;

                this.pixels[r][c] = color;
            }
        }
    }

    // To debug, let's print the mask
    fillMask(mask:Mask|undefined){
      if (!mask) return;
        for(let r = 0; r < this.height ; r++) {
            for(let c = 0; c < this.width ; c++) {
                //if (c==r) console.log(c+"=> "+mask.mask[r][c]);
                if(!mask.mask[r] || !mask.mask[r][c] || mask.mask[r][c] == 0)
                    this.pixels[r][c] = new Color(0, 0, 0, 1);
                else
                    this.pixels[r][c] = new Color(1, 1, 1, 1);
            }
        }
    }

    // VERY SLOW
    fillByShapedTile(tiles:Tile[], derivedBuffers:DerivedBuffer[]) {
      for(let tile of tiles) {
        derivedBuffers.forEach((derivedBuffer, i) => {
            let mask:Mask|undefined = derivedBuffer.mask;
            let color = derivedBuffer.colorScale.map(tile.dataValues[i]);

            for(let r = Math.ceil(tile.y); r < tile.y + tile.mask.height; r++) {
              if(r >= this.height) break;
              for(let c = Math.ceil(tile.x); c < tile.x + tile.mask.width; c++) {
                  if(c >= this.width) break;

                  if (mask && !mask.pols.isPointInPolys(c, r))
                    continue;

                  this.pixels[r][c] = color;
              }
          }
        });
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

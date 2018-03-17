import Point from './point';
import Color from './color';
import Mask from './mask';
import Tile from './tile';
import Rect from './rect';
import * as util from './util';
import DerivedBuffer from './derived-buffer';

export default class Image {
    imageCanvas?:HTMLCanvasElement;

    constructor(public width:number, public height:number,
                public pixels:Color[][]
                = util.create2D<Color>(width, height, Color.None)) {
    }

    render(color: Color, rect: Rect):void;
    render(canvas: HTMLCanvasElement, at: Point): void;
    render(imageData: ImageData, tile:Tile):void;
    render(color: Color, tile: Tile, mask?: Mask):void;

    render(source: Color | ImageData | HTMLCanvasElement,
           shapeOrPoint:Rect | Tile | Point, mask?: Mask) {
        if(source instanceof Color) {
            if(shapeOrPoint instanceof Tile) {
                this.fillColorByTile(source as Color,
                                     shapeOrPoint as Tile,
                                     mask as Mask | undefined);
            }
            else {
                this.fillColorByRect(source as Color,
                                     shapeOrPoint as Rect);
            }
        }
        else if(source instanceof ImageData) {
            this.putImageByTile(source as ImageData,
                                shapeOrPoint as Tile);
        }
        else if(source instanceof HTMLCanvasElement) {
            this.drawTileAtPosition(source as HTMLCanvasElement,
                                    shapeOrPoint as Point);
        }
    }

    private fillColorByTile(color:Color, tile:Tile, mask?:Mask) {
        let tmask = tile.mask,
            y     = Math.ceil(tile.y),
            maxy  = Math.min(tile.y + tmask.height, this.height),
            x     = Math.ceil(tile.x),
            maxx  = Math.min(tile.x + tmask.width, this.width);

        if (mask) {
            for(let r = y; r < maxy; r++) {
                for(let c = Math.ceil(tile.x); c < tile.x + tile.mask.width; c++) {
                    if(tmask.mask[r-y][c-x] == 0)
                        continue;
                    if(r < mask.height && c < mask.width && mask.mask[r][c] == 0)
                        continue;
                    this.pixels[r][c] = color;
                }
            }
        }
        else {
            for(let r = y; r < maxy; r++) {
                for(let c = Math.ceil(tile.x); c < tile.x + tile.mask.width; c++) {
                    if(tmask.mask[r-y][c-x] == 0)
                        continue;
                    this.pixels[r][c] = color;
                }
            }
        }
    }

    private drawTileAtPosition(canvas:HTMLCanvasElement, point:Point){
        if (this.imageCanvas == undefined) {
            this.imageCanvas = document.createElement('canvas');
            if (this.imageCanvas == null) {
                console.log('cannot create canvas');
                throw 'cannot create canvas';
            }
            this.imageCanvas.width  = this.width;
            this.imageCanvas.height = this.height;
        }

        let ctx = this.imageCanvas.getContext("2d")!;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.drawImage(canvas, -canvas.width/2, -canvas.height/2);
        ctx.restore();
    }

    private fillColorByRect(color:Color, rect:Rect) {
        for(let r = rect.min.y; r < rect.max.y; r++) {
            if(r >= this.height) break;
            for(let c = rect.min.x; c < rect.max.x; c++) {
                if(c >= this.width) break;
                this.pixels[r][c] = color.clone();
            }
        }
    }

    // default to center
    private putImageByTile(imageData:ImageData, tile:Tile) {
        let width = imageData.width;
        let height = imageData.height;

        let topLeft = new Point(tile.x + tile.mask.width / 2 - width / 2 ,
                                tile.y + tile.mask.height / 2 - height / 2).round();

        let data = imageData.data;

        for(let r = 0; r < height; r++) {
            for(let c = 0; c < width; c++) {
                let tr = r + topLeft.y; // target row
                let tc = c + topLeft.x; // target column

                if(tr < 0 || tc < 0 || tr >= this.height || tc >= this.width) continue;

                this.pixels[tr][tc] = new Color(
                    data[(r * width + c) * 4    ] / 255,
                    data[(r * width + c) * 4 + 1] / 255,
                    data[(r * width + c) * 4 + 2] / 255,
                    data[(r * width + c) * 4 + 3] / 255,
                );
            }
        }
    }

    // fillByTile2(color:Color, tile:Tile, mask?:Mask) {
    //     let ctx = this.imageCanvas.getContext("2d")!;
    //     let pixels = ctx.getImageData(0, 0, this.width, this.height);
    //     let r1 = Math.round(color.r*255);
    //     let g1 = Math.round(color.g*255);
    //     let b1 = Math.round(color.b*255);
    //     let a1 = Math.round(color.a*255);
    //     for(let r = Math.ceil(tile.y); r < Math.min(this.height, tile.y + tile.mask.height); r++) {
    //         for(let c = Math.ceil(tile.x); c < Math.min(this.width, tile.x + tile.mask.width); c++) {
    //             // mask of the tile
    //             if(tile.mask && tile.mask.mask[r-Math.ceil(tile.y)][c-Math.ceil(tile.x)] == 0)
    //             continue;
    //             // global mask
    //             if(mask && r < mask.height && c < mask.width && mask.mask[r][c] == 0)
    //             continue;

    //             pixels.data[c*4+r*4*this.width +0] = r1;
    //             pixels.data[c*4+r*4*this.width +1] = g1;
    //             pixels.data[c*4+r*4*this.width +2] = b1;
    //             pixels.data[c*4+r*4*this.width +3] = a1;
    //         }
    //     }
    //     ctx.putImageData(pixels, 0, 0);
    // }

    // To debug, let's print the mask
     fillMask(mask:Mask|undefined){
       if (!mask) return;
         for(let r = 0; r < this.height ; r++) {
             for(let c = 0; c < this.width ; c++) {
                 if (mask.mask[r][c] == 0)
                     this.pixels[r][c] = Color.Black;
                 else
                     this.pixels[r][c] = Color.White;
             }
         }
     }

    // VERY SLOW
    // fillByShapedTile(tiles:Tile[], derivedBuffers:DerivedBuffer[]) {
    //   for(let tile of tiles) {
    //     derivedBuffers.forEach((derivedBuffer, i) => {
    //         let mask:Mask|undefined = derivedBuffer.mask;
    //         let color = derivedBuffer.colorScale.map(tile.dataValues[i]);

    //         for(let r = Math.ceil(tile.y); r < tile.y + tile.mask.height; r++) {
    //           if(r >= this.height) break;
    //           for(let c = Math.ceil(tile.x); c < tile.x + tile.mask.width; c++) {
    //               if(c >= this.width) break;

    //               if (mask && !mask.pols.isPointInPolys(c, r))
    //                 continue;

    //               this.pixels[r][c] = color;
    //           }
    //       }
    //     });
    //   }
    // }

}


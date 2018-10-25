import Point from './point';
import Color from './color';
import Mask from './mask';
import Tile from './tile';
import Rect from './rect';
import * as util from './util';
import ClassBuffer from './class-buffer';

//[jdf] Change internal structure from array of Colors to 4 arrays of numbers.
// Probably as an ImageData https://developer.mozilla.org/en-US/docs/Web/API/ImageData

export default class Image {
    imageCanvas?: HTMLCanvasElement;

    constructor(public width: number, public height: number,
        public pixels: Color[][]
            = util.create2D<Color>(width, height, Color.None)) {
    }

    render(color: Color, rect: Rect): void;
    render(canvas: HTMLCanvasElement, at: Point, options?: any): void;
    render(color: Color, tile: Tile, mask?: Mask): void;

    render(source: Color | HTMLCanvasElement,
        shapeOrPoint: Rect | Tile | Point, mask?: Mask | any) {
        if (source instanceof Color) {
            if (shapeOrPoint instanceof Tile) {
                this.fillColorByTile(source as Color,
                    shapeOrPoint as Tile,
                    mask as Mask | undefined);
            }
            else {
                this.fillColorByRect(source as Color,
                    shapeOrPoint as Rect);
            }
        }
        else if (source instanceof HTMLCanvasElement) {
            this.drawTileAtPosition(source as HTMLCanvasElement,
                shapeOrPoint as Point, mask);
        }
    }

    private fillColorByTile(color: Color, tile: Tile, mask?: Mask) {
        let tmask = tile.mask,
            y = Math.ceil(tile.y),
            x = Math.ceil(tile.x);

        if (tmask.width == 1 && tmask.height == 1) {
            if ((mask == undefined || mask.mask[y][x] != 0) && tmask.mask[0][0] != 0)
                this.pixels[y][x] = color;
            return;
        }

        let maxy = Math.min(tile.y + tmask.height, this.height),
            maxx = Math.min(tile.x + tmask.width, this.width);

        if (mask) {
            for (let r = y; r < maxy; r++) {
                let trow = tmask.mask[r - y];
                let row = this.pixels[r];
                for (let c = x; c < maxx; c++) {
                    if (trow[c - x] == 0)
                        continue;
                    if (r < mask.height &&
                        c < mask.width &&
                        mask.mask[r][c] == 0)
                        continue;
                    row[c] = color;
                }
            }
        }
        else {
            for (let r = y; r < maxy; r++) {
                let trow = tmask.mask[r - y];
                let row = this.pixels[r];
                for (let c = x; c < maxx; c++) {
                    if (trow[c - x] == 0)
                        continue;
                    row[c] = color;
                }
            }
        }
    }

    private checkOrCreate() {
        if (this.imageCanvas == undefined) {
            this.imageCanvas = document.createElement('canvas');
            if (this.imageCanvas == null) {
                console.log('cannot create canvas');
                throw 'cannot create canvas';
            }
            this.imageCanvas.width = this.width;
            this.imageCanvas.height = this.height;
        }
    }

    private drawTileAtPosition(canvas: HTMLCanvasElement, point: Point, options?: any) {
        this.checkOrCreate();

        let ctx = this.imageCanvas!.getContext("2d")!;
        ctx.save();

        if (options && options.width && options.height) {
            let width = options.width!;
            let height = options.height!;

            ctx.drawImage(canvas, point.x - width / 2, point.y - height / 2, width, height);
        }
        else {
            ctx.translate(point.x, point.y);
            ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        }

        ctx.restore();
    }

    private fillColorByRect(color: Color, rect: Rect) {
        for (let r = rect.min.y; r < rect.max.y; r++) {
            if (r >= this.height) break;
            for (let c = rect.min.x; c < rect.max.x; c++) {
                if (c >= this.width) break;
                this.pixels[r][c] = color.clone();
            }
        }
    }

    // To debug, let's print the mask
    fillMask(mask: Mask | undefined) {
        if (!mask) return;
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (mask.mask[r][c] == 0)
                    this.pixels[r][c] = Color.Black;
                else
                    this.pixels[r][c] = Color.White;
            }
        }
    }
}


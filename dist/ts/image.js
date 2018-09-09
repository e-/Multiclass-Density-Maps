"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = __importDefault(require("./color"));
const tile_1 = __importDefault(require("./tile"));
const util = __importStar(require("./util"));
//[jdf] Change internal structure from array of Colors to 4 arrays of numbers.
// Probably as an ImageData https://developer.mozilla.org/en-US/docs/Web/API/ImageData
class Image {
    constructor(width, height, pixels = util.create2D(width, height, color_1.default.None)) {
        this.width = width;
        this.height = height;
        this.pixels = pixels;
    }
    render(source, shapeOrPoint, mask) {
        if (source instanceof color_1.default) {
            if (shapeOrPoint instanceof tile_1.default) {
                this.fillColorByTile(source, shapeOrPoint, mask);
            }
            else {
                this.fillColorByRect(source, shapeOrPoint);
            }
        }
        else if (source instanceof HTMLCanvasElement) {
            this.drawTileAtPosition(source, shapeOrPoint, mask);
        }
    }
    fillColorByTile(color, tile, mask) {
        let tmask = tile.mask, y = Math.ceil(tile.y), x = Math.ceil(tile.x);
        if (tmask.width == 1 && tmask.height == 1) {
            if ((mask == undefined || mask.mask[y][x] != 0) && tmask.mask[0][0] != 0)
                this.pixels[y][x] = color;
            return;
        }
        let maxy = Math.min(tile.y + tmask.height, this.height), maxx = Math.min(tile.x + tmask.width, this.width);
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
    checkOrCreate() {
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
    drawTileAtPosition(canvas, point, options) {
        this.checkOrCreate();
        let ctx = this.imageCanvas.getContext("2d");
        ctx.save();
        if (options && options.width && options.height) {
            let width = options.width;
            let height = options.height;
            ctx.drawImage(canvas, point.x - width / 2, point.y - height / 2, width, height);
        }
        else {
            ctx.translate(point.x, point.y);
            ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        }
        ctx.restore();
    }
    fillColorByRect(color, rect) {
        for (let r = rect.min.y; r < rect.max.y; r++) {
            if (r >= this.height)
                break;
            for (let c = rect.min.x; c < rect.max.x; c++) {
                if (c >= this.width)
                    break;
                this.pixels[r][c] = color.clone();
            }
        }
    }
    // To debug, let's print the mask
    fillMask(mask) {
        if (!mask)
            return;
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (mask.mask[r][c] == 0)
                    this.pixels[r][c] = color_1.default.Black;
                else
                    this.pixels[r][c] = color_1.default.White;
            }
        }
    }
}
exports.default = Image;
//# sourceMappingURL=image.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
class Color {
    constructor(r = 1, g = 1, b = 1, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    clamp() {
        return new Color(Math.min(Math.max(this.r, 0), 1), Math.min(Math.max(this.g, 0), 1), Math.min(Math.max(this.b, 0), 1), Math.min(Math.max(this.a, 0), 1));
    }
    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
    darken(v) {
        return new Color(this.r * v, this.g * v, this.b * v, this.a);
    }
    whiten(v) {
        return new Color(this.r + (1 - v) * (1 - this.r), this.g + (1 - v) * (1 - this.g), this.b + (1 - v) * (1 - this.b), this.a);
    }
    dissolve(v) {
        return new Color(this.r * v, this.g * v, this.b * v, this.a * v);
    }
    add(c) {
        return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a);
    }
    static compose(a, fa, b, fb) {
        return new Color(a.r * fa + b.r * fb, a.g * fa + b.g * fb, a.b * fa + b.b * fb, a.a * fa + b.a * fb);
    }
}
exports.Color = Color;
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
exports.Point = Point;
class Rect {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
}
exports.Rect = Rect;
function create2D(width, height, value) {
    let arr = [];
    for (let i = 0; i < height; ++i) {
        arr.push(new Array(width));
        for (let j = 0; j < width; ++j) {
            arr[i][j] = value;
        }
    }
    return arr;
}
exports.create2D = create2D;
//import 'path2d';
class Mask {
    constructor(width, height, default_value = 1, mask = create2D(width, height, default_value)) {
        this.width = width;
        this.height = height;
        this.mask = mask;
        this.path = new Path2D();
    }
}
exports.Mask = Mask;
class DataBuffer {
    constructor(name, width, height, values = create2D(width, height, 0)) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.values = values;
        this.color = new Color();
        this.mask = null;
    }
    reset() {
        for (let i = 0; i < this.height; ++i) {
            for (let j = 0; j < this.width; ++j) {
                this.values[i][j] = 0;
            }
        }
        this.setMask(null);
    }
    setMask(mask) {
        this.mask = mask;
    }
}
exports.DataBuffer = DataBuffer;
function weavingRandomMasks(m, size, width, height) {
    let masks = Array(m);
    size = Math.floor(size);
    for (let i = 0; i < m; i++) {
        masks[i] = new Mask(width, height, 0);
    }
    for (let row = 0; row < height; row += size) {
        let row_max = Math.min(row + size, height);
        for (let col = 0; col < width; col += size) {
            let col_max = Math.min(col + size, width);
            let selected = Math.floor(Math.random() * m);
            let mask = masks[selected];
            mask.path.rect(row, col, size, size);
            for (let r = row; r < row_max; r++) {
                for (let c = col; c < col_max; c++) {
                    mask.mask[r][c] = 1;
                }
            }
        }
    }
    return masks;
}
exports.weavingRandomMasks = weavingRandomMasks;
function renderTileWeaving(image, tile, buffers, bufferValues) {
    for (let i = 0; i < buffers.length; i++) {
        let databuffer = buffers[i];
        let color = databuffer.color.whiten(bufferValues[i]);
        image.setMask(databuffer.mask);
        image.fillByTile(color, tile);
    }
}
exports.renderTileWeaving = renderTileWeaving;
var TileAggregation;
(function (TileAggregation) {
    TileAggregation[TileAggregation["Min"] = 0] = "Min";
    TileAggregation[TileAggregation["Mean"] = 1] = "Mean";
    TileAggregation[TileAggregation["Sum"] = 2] = "Sum";
    TileAggregation[TileAggregation["Max"] = 3] = "Max";
})(TileAggregation = exports.TileAggregation || (exports.TileAggregation = {}));
class Tile extends Point {
    constructor(x, y, mask) {
        super(x, y);
        this.mask = mask;
    }
    aggregate(buffer, op = TileAggregation.Mean) {
        let val = 0;
        let cnt = 0;
        for (let r = this.y; r < this.y + this.mask.height; r++) {
            if (r >= buffer.height)
                break;
            for (let c = this.x; c < this.x + this.mask.width; c++) {
                if (c >= buffer.width)
                    break;
                cnt++;
                if (cnt == 0)
                    val = buffer.values[r][c];
                else {
                    let current = buffer.values[r][c];
                    switch (op) {
                        case TileAggregation.Min:
                            val = Math.min(val, current);
                            break;
                        case TileAggregation.Mean:
                        case TileAggregation.Sum:
                            val += current;
                            break;
                        case TileAggregation.Max:
                            val = Math.max(val, current);
                            break;
                    }
                }
            }
        }
        if (op === TileAggregation.Mean && cnt > 0) {
            val /= cnt;
        }
        return val;
    }
}
exports.Tile = Tile;
class PixelTiling {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }
    [Symbol.iterator]() {
        this.x = 0;
        this.y = 0;
        return this;
    }
    next() {
        let x = this.x, y = this.y;
        this.x++;
        if (this.x > this.width) {
            this.y++;
            this.x = 0;
        }
        return {
            done: this.y >= this.height,
            value: new Tile(x, y, new Mask(1, 1))
        };
    }
}
exports.PixelTiling = PixelTiling;
class RectangularTiling {
    constructor(width, height, tileWidth, tileHeight) {
        this.width = width;
        this.height = height;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.rows = 0;
        this.cols = 0;
        this.row = 0;
        this.col = 0;
        this.rows = Math.ceil(height / tileHeight);
        this.cols = Math.ceil(width / tileWidth);
    }
    [Symbol.iterator]() {
        this.row = 0;
        this.col = 0;
        return this;
    }
    next() {
        let row = this.row, col = this.col;
        this.col++;
        if (this.col >= this.cols) {
            this.row++;
            this.col = 0;
        }
        return {
            done: this.row >= this.rows,
            value: new Tile(col * this.tileWidth, row * this.tileHeight, new Mask(this.tileWidth, this.tileHeight))
        };
    }
}
exports.RectangularTiling = RectangularTiling;
class Image {
    constructor(width, height, pixels = create2D(width, height, new Color())) {
        this.width = width;
        this.height = height;
        this.pixels = pixels;
        this.mask = null;
    }
    setMask(m) {
        this.mask = m;
    }
    fillByTile(color, tile) {
        for (let r = tile.y; r < tile.y + tile.mask.height; r++) {
            if (r >= this.height)
                break;
            for (let c = tile.x; c < tile.x + tile.mask.width; c++) {
                if (c >= this.width)
                    break;
                if (this.mask != null && r < this.mask.width && c < this.mask.height) {
                    if (this.mask.mask[r][c] == 0)
                        continue;
                }
                let v = tile.mask.mask[r - tile.y][c - tile.x];
                this.pixels[r][c] = color.darken(v);
            }
        }
    }
    fillByRect(color, rect) {
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
}
exports.Image = Image;
class CanvasRenderer {
    static render(image, id) {
        let canvas = document.getElementById(id);
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let r = Math.floor(i / 4 / image.width);
            let c = i / 4 % image.width;
            data[i] = image.pixels[r][c].r * 255;
            data[i + 1] = image.pixels[r][c].g * 255;
            data[i + 2] = image.pixels[r][c].b * 255;
            data[i + 3] = image.pixels[r][c].a * 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }
}
exports.CanvasRenderer = CanvasRenderer;
/// <reference path="multivariate-normal.d.ts" />
const multivariate_normal_1 = __importDefault(require("multivariate-normal"));
class TestMain {
    constructor() {
    }
    randomPointsWithClass(n, mean, cov) {
        let dist = multivariate_normal_1.default(mean, cov);
        return new Array(n).fill(0).map(() => {
            let point = dist.sample();
            return point;
        });
    }
    bin(points, binSize, bounds) {
        let count = create2D(binSize, binSize, 0);
        points.forEach(([x, y]) => {
            let xb = Math.floor((x - bounds[0][0]) / (bounds[0][1] - bounds[0][0]) * binSize);
            let yb = Math.floor((y - bounds[1][0]) / (bounds[1][1] - bounds[1][0]) * binSize);
            if (xb >= binSize)
                xb = binSize - 1;
            if (yb >= binSize)
                yb = binSize - 1;
            if (xb < 0)
                xb = 0;
            if (yb < 0)
                yb = 0;
            count[yb][xb]++;
        });
        return count;
    }
    normalize(binned) {
        let arrayMax = (arr) => Math.max.apply({}, arr);
        let maxValue = arrayMax(binned.map(rows => arrayMax(rows.map(row => arrayMax(row)))));
        return binned.map(rows => rows.map(row => row.map(value => value / maxValue)));
    }
    composeMax(buffers, bufferValues) {
        let best = bufferValues[0];
        let bestIndex = 0;
        bufferValues.forEach((bufferValue, i) => {
            if (bufferValue > best) {
                best = bufferValue;
                bestIndex = i;
            }
        });
        return buffers[bestIndex].color.whiten(best);
    }
    composeMix(buffers, bufferValues) {
        let sum = 0;
        let ret = new Color(0, 0, 0, 1);
        bufferValues.forEach((bufferValue, i) => {
            sum += bufferValue;
            ret = ret.add(buffers[i].color.whiten(bufferValue));
        });
        if (sum > 0)
            ret = ret.dissolve(1 / buffers.length); // TODO: is this correct?
        return ret;
    }
    main() {
        let nClass = 3;
        let width = 256, height = 256;
        let pointSets = [
            this.randomPointsWithClass(3000, [2, 3], [[1, 0.3], [0.3, 1]]),
            this.randomPointsWithClass(3000, [-1, -3.5], [[1, -0.1], [-0.1, 1]]),
            this.randomPointsWithClass(3000, [1, -2], [[1, 0.6], [0.6, 1]])
        ];
        // binning on the client side since we do not have a server
        let binned = pointSets.map(points => this.bin(points, width, [[-7, 7], [-7, 7]]));
        // normlize bins
        binned = this.normalize(binned);
        // computeDerivedBuffers()
        let dataBuffers = binned.map((binnedPoints, i) => {
            return new DataBuffer(`class ${i}`, width, height, binnedPoints);
        });
        let colors = [
            new Color(31 / 255, 120 / 255, 180 / 255, 1),
            new Color(255 / 255, 127 / 255, 0 / 255, 1),
            new Color(51 / 255, 160 / 255, 44 / 255, 1) // green
        ];
        // assignProperties()
        dataBuffers.forEach((dataBuffer, i) => {
            dataBuffer.color = colors[i];
        });
        let pixelTiling = new PixelTiling(width, height);
        let outputImage1 = new Image(width, height);
        for (let tile of pixelTiling) {
            let bufferValues = dataBuffers.map((buffer) => tile.aggregate(buffer, TileAggregation.Sum));
            let color = this.composeMax(dataBuffers, bufferValues);
            outputImage1.fillByTile(color, tile);
        }
        CanvasRenderer.render(outputImage1, 'canvas1');
        let rectangularTiling = new RectangularTiling(width, height, width / 64, height / 64);
        let outputImage2 = new Image(width, height);
        for (let tile of rectangularTiling) {
            let bufferValues = dataBuffers.map((buffer) => tile.aggregate(buffer, TileAggregation.Sum));
            // TODO: we need to RE-normalize buffer values.
            let color = this.composeMax(dataBuffers, bufferValues);
            outputImage2.fillByTile(color, tile);
        }
        CanvasRenderer.render(outputImage2, 'canvas2');
        let outputImage3 = new Image(width, height);
        for (let tile of rectangularTiling) {
            let bufferValues = dataBuffers.map((buffer) => tile.aggregate(buffer, TileAggregation.Sum));
            // TODO: we need to RE-normalize buffer values.
            let color = this.composeMix(dataBuffers, bufferValues);
            outputImage3.fillByTile(color, tile);
        }
        CanvasRenderer.render(outputImage3, 'canvas3');
        let bigRectangularTiling = new RectangularTiling(width, height, 8, 8);
        let outputImage4 = new Image(width, height);
        let masks = weavingRandomMasks(3, 4, width, height);
        for (let tile of bigRectangularTiling) {
            let bufferValues = dataBuffers.map((buffer) => tile.aggregate(buffer, TileAggregation.Sum));
            // TODO: we need to RE-normalize buffer values.
            renderTileWeaving(outputImage4, tile, dataBuffers, bufferValues);
        }
        CanvasRenderer.render(outputImage4, 'canvas4');
    }
}
exports.TestMain = TestMain;
//# sourceMappingURL=index.js.map
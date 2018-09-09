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
const point_1 = __importDefault(require("./point"));
const rect_1 = __importDefault(require("./rect"));
const util = __importStar(require("./util"));
var TileAggregation;
(function (TileAggregation) {
    TileAggregation[TileAggregation["Min"] = 0] = "Min";
    TileAggregation[TileAggregation["Mean"] = 1] = "Mean";
    TileAggregation[TileAggregation["Sum"] = 2] = "Sum";
    TileAggregation[TileAggregation["Max"] = 3] = "Max";
})(TileAggregation = exports.TileAggregation || (exports.TileAggregation = {}));
class Tile extends point_1.default {
    constructor(x, y, mask, center = new point_1.default(x + mask.width / 2, y + mask.height / 2)) {
        super(x, y);
        this.mask = mask;
        this.center = center;
        this.dataValues = [];
    }
    area() { return this.mask.area(); }
    rowcounts() { return this.mask.rowcounts(); }
    pixcount(step = 1) { return this.mask.pixcount(step); }
    maxValue() { return util.amax(this.dataValues); }
    sumValue() { return util.asum(this.dataValues); }
    contains(x, y) {
        if (x < this.x ||
            y < this.y ||
            x >= (this.x + this.mask.width) ||
            y >= (this.y + this.mask.height))
            return false;
        return this.mask.mask[y - this.y][x - this.x] != 0;
    }
    aggregateOne(buffer, op = TileAggregation.Mean) {
        let val = 0;
        let cnt = 0;
        let r0 = Math.ceil(this.y);
        let c0 = Math.ceil(this.x);
        let rmax = Math.min(this.y + this.mask.height, buffer.height);
        let cmax = Math.min(this.x + this.mask.width, buffer.width);
        for (let r = r0; r < rmax; r++) {
            let row = buffer.values[r];
            let mrow = this.mask.mask[r - r0];
            for (let c = c0; c < cmax; c++) {
                if (mrow[c - c0] == 0)
                    continue;
                if (cnt == 0)
                    val = row[c];
                else {
                    let current = row[c];
                    switch (op) {
                        case TileAggregation.Min:
                            if (current == 0)
                                continue;
                            if (val == 0)
                                val = current;
                            else
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
                cnt++;
            }
        }
        if (op === TileAggregation.Mean && cnt > 0) {
            val /= cnt;
        }
        return val;
    }
    aggregate(buffers, op = TileAggregation.Mean) {
        // Just one thing to aggregate ? let's return it
        if (this.mask.height == 1 && this.mask.width == 1)
            return buffers.map(buffer => buffer.values[Math.ceil(this.y)][Math.ceil(this.x)]);
        else
            return buffers.map(buffer => this.aggregateOne(buffer, op));
    }
    getRectAtCenter() {
        if (this.mask && this.mask.path != undefined) {
            let poly = this.mask.path.pts;
            let center = util.largeRectInPoly(poly, {
                angle: 0,
                aspectRatio: 1,
                nTries: 100
            });
            if (!center) {
                return null;
            }
            let p = center[0];
            return new rect_1.default(new point_1.default(p.cx - p.width / 2, p.cy - p.height / 2), new point_1.default(p.cx + p.width / 2, p.cy + p.height / 2));
        }
        return new rect_1.default(new point_1.default(this.x, this.y), new point_1.default(this.x + this.mask.width, this.y + this.mask.height));
    }
}
exports.default = Tile;
//# sourceMappingURL=tile.js.map
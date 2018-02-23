"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Color = /** @class */ (function () {
    function Color(r, g, b, a) {
        if (r === void 0) { r = 0; }
        if (g === void 0) { g = 0; }
        if (b === void 0) { b = 0; }
        if (a === void 0) { a = 1; }
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    Color.prototype.clamp = function () {
        return new Color(Math.min(Math.max(this.r, 0), 1), Math.min(Math.max(this.g, 0), 1), Math.min(Math.max(this.b, 0), 1), Math.min(Math.max(this.a, 0), 1));
    };
    Color.prototype.clone = function () {
        return new Color(this.r, this.g, this.b, this.a);
    };
    Color.prototype.darken = function (v) {
        return new Color(this.r * v, this.g * v, this.b * v, this.a);
    };
    Color.prototype.dissolve = function (v) {
        return new Color(this.r * v, this.g * v, this.b * v, this.a * v);
    };
    Color.compose = function (a, fa, b, fb) {
        return new Color(a.r * fa + b.r * fb, a.g * fa + b.g * fb, a.b * fa + b.b * fb, a.a * fa + b.a * fb);
    };
    return Color;
}());
exports.Color = Color;
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());
exports.Point = Point;
var Rect = /** @class */ (function () {
    function Rect(min, max) {
        this.min = min;
        this.max = max;
    }
    return Rect;
}());
exports.Rect = Rect;
function create2D(width, height, value) {
    var arr = [];
    for (var i = 0; i < height; ++i) {
        arr.push(new Array(width));
        for (var j = 0; j < width; ++j) {
            arr[i][j] = value;
        }
    }
    return arr;
}
var Mask = /** @class */ (function () {
    function Mask(width, height, mask) {
        if (mask === void 0) { mask = create2D(width, height, 1); }
        this.width = width;
        this.height = height;
        this.mask = mask;
    }
    return Mask;
}());
exports.Mask = Mask;
var DataBuffer = /** @class */ (function () {
    function DataBuffer(name, width, height, values) {
        if (values === void 0) { values = create2D(width, height, 0); }
        this.name = name;
        this.width = width;
        this.height = height;
        this.values = values;
        this.color = new Color();
    }
    DataBuffer.prototype.reset = function () {
        for (var i = 0; i < this.height; ++i) {
            for (var j = 0; j < this.width; ++j) {
                this.values[i][j] = 0;
            }
        }
    };
    return DataBuffer;
}());
exports.DataBuffer = DataBuffer;
var TileAggregation;
(function (TileAggregation) {
    TileAggregation[TileAggregation["Min"] = 0] = "Min";
    TileAggregation[TileAggregation["Mean"] = 1] = "Mean";
    TileAggregation[TileAggregation["Sum"] = 2] = "Sum";
    TileAggregation[TileAggregation["Max"] = 3] = "Max";
})(TileAggregation = exports.TileAggregation || (exports.TileAggregation = {}));
var Tile = /** @class */ (function (_super) {
    __extends(Tile, _super);
    function Tile(x, y, mask) {
        var _this = _super.call(this, x, y) || this;
        _this.mask = mask;
        return _this;
    }
    Tile.prototype.aggregate = function (buffer, op) {
        if (op === void 0) { op = TileAggregation.Mean; }
        var val = 0;
        var cnt = 0;
        for (var r = this.y; r < this.y + this.mask.height; r++) {
            if (r >= buffer.height)
                break;
            for (var c = this.x; c < this.x + this.mask.width; c++) {
                if (c >= buffer.width)
                    break;
                cnt++;
                if (cnt == 0)
                    val = buffer.values[r][c];
                else {
                    var current = buffer.values[r][c];
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
    };
    return Tile;
}(Point));
exports.Tile = Tile;
var PixelTiling = /** @class */ (function () {
    function PixelTiling(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }
    PixelTiling.prototype[Symbol.iterator] = function () {
        this.x = 0;
        this.y = 0;
        return this;
    };
    PixelTiling.prototype.next = function () {
        var x = this.x, y = this.y;
        this.x++;
        if (this.x > this.width) {
            this.y++;
            this.x = 0;
        }
        return {
            done: this.y >= this.height,
            value: new Tile(x, y, new Mask(1, 1, [[1]]))
        };
    };
    return PixelTiling;
}());
exports.PixelTiling = PixelTiling;
var Image = /** @class */ (function () {
    function Image(width, height, pixels) {
        if (pixels === void 0) { pixels = create2D(width, height, new Color()); }
        this.width = width;
        this.height = height;
        this.pixels = pixels;
    }
    Image.prototype.fillByTile = function (color, tile) {
        for (var r = tile.y; r < tile.y + tile.mask.height; r++) {
            if (r >= this.height)
                break;
            for (var c = tile.x; c < tile.x + tile.mask.width; c++) {
                if (c >= this.width)
                    break;
                var v = tile.mask.mask[r - tile.y][c - tile.x];
                this.pixels[r][c] = color.darken(v);
            }
        }
    };
    Image.prototype.fillByRect = function (color, rect) {
        for (var r = rect.min.y; r < rect.max.y; r++) {
            if (r >= this.height)
                break;
            for (var c = rect.min.x; c < rect.max.x; c++) {
                if (c >= this.width)
                    break;
                this.pixels[r][c] = color.clone();
            }
        }
    };
    return Image;
}());
exports.Image = Image;
var TestMain = /** @class */ (function () {
    function TestMain(x) {
        this.x = x;
    }
    TestMain.prototype.main = function () {
        console.log(1234277721);
    };
    return TestMain;
}());
exports.TestMain = TestMain;
//# sourceMappingURL=index.js.map
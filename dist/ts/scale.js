"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = __importDefault(require("./color"));
const tdigest_1 = require("tdigest");
const util_1 = require("./util");
class LinearScale {
    constructor(domain, range, clamp = true) {
        this.domain = domain;
        this.range = range;
        this.type = "linear";
        this.scale = (this.range[1] - this.range[0]) / (this.domain[1] - this.domain[0]);
        this.min = util_1.amin(this.range);
        this.max = util_1.amax(this.range);
    }
    clamp(value) {
        if (value < this.min)
            return this.min;
        if (value > this.max)
            return this.max;
        return value;
    }
    map(value) {
        let ret = (value - this.domain[0]) * this.scale + this.range[0];
        if (this.clamp)
            return this.clamp(ret);
        return ret;
    }
    invmap(value) {
        let dmin = util_1.amin(this.domain), dmax = util_1.amax(this.domain);
        if (value <= this.min)
            return this.scale > 0 ? dmin : dmax;
        if (value >= this.max)
            return this.scale > 0 ? dmax : dmin;
        return (value - this.range[0]) / this.scale + this.domain[0];
    }
}
exports.LinearScale = LinearScale;
class LogScale {
    constructor(domain, range, base = Math.E) {
        this.domain = domain;
        this.range = range;
        this.base = base;
        this.type = "log";
        this.logBase = Math.log(base);
        this.internalScale = new LinearScale([Math.log(domain[0]) / this.logBase, Math.log(domain[1]) / this.logBase], range);
    }
    map(value) {
        if (value === 0)
            return NaN;
        return this.internalScale.map(Math.log(value) / this.logBase);
    }
    invmap(value) {
        return Math.exp(this.internalScale.invmap(value) * this.logBase);
    }
}
exports.LogScale = LogScale;
class RootScale {
    constructor(domain, range, degree = 2) {
        this.domain = domain;
        this.range = range;
        this.degree = degree;
        this.type = "root";
        this.internalScale = new LinearScale([Math.pow(domain[0], 1 / degree), Math.pow(domain[1], 1 / degree)], range);
    }
    map(value) {
        return this.internalScale.map(Math.pow(value, 1 / this.degree));
    }
    invmap(value) {
        return Math.pow(this.internalScale.invmap(value), this.degree);
    }
}
exports.RootScale = RootScale;
class SquareRootScale extends RootScale {
    constructor(domain, range) {
        super(domain, range, 2);
        this.domain = domain;
        this.range = range;
        this.type = "sqrt";
    }
}
exports.SquareRootScale = SquareRootScale;
class CubicRootScale extends RootScale {
    constructor(domain, range) {
        super(domain, range, 3);
        this.domain = domain;
        this.range = range;
        this.type = "cbrt";
    }
}
exports.CubicRootScale = CubicRootScale;
class EquiDepthScale {
    constructor(domain, range, level = 32) {
        this.domain = domain;
        this.range = range;
        this.level = level;
        this.type = "equidepth";
        this.bounds = [];
        this.minBound = 0;
        this.digest = new tdigest_1.Digest();
        this.addPoints(domain); // initialize with something
    }
    addPoints(points) { this.digest.push(points.filter(util_1.positive)); }
    addPoint(point) {
        if (util_1.positive(point))
            this.digest.push(point);
    }
    computeBounds() {
        this.digest.compress();
        let n = this.level; //-1;
        this.minBound = this.digest.percentile(0);
        this.bounds = this.digest.percentile(util_1.arange(n).map(i => ((i + 1) / n)));
    }
    getBounds() {
        if (this.bounds.length == 0) {
            this.computeBounds();
        }
        return this.bounds;
    }
    map(value) {
        // linear search is faster than binary search for that simple case
        // https://hannes.muehleisen.org/damon2017-simd-imprints.pdf
        let min = this.range[0];
        if (value <= this.domain[0])
            return min;
        if (value >= this.domain[1])
            return this.range[1];
        let n = this.level - 1, w = this.range[1] - min;
        this.getBounds();
        for (let i = 0; i < n; i++)
            if (value < this.bounds[i])
                return min + w / n * i;
        return min + w;
    }
    invmap(value) {
        this.getBounds();
        if (value < this.range[0])
            return this.minBound;
        if (value > this.range[1])
            return this.bounds[this.level - 1];
        let v = (value - this.range[0]) / (this.range[1] - this.range[0]) * this.level, i = Math.floor(v), r = v - i;
        let left = i === 0 ? this.minBound : this.bounds[i - 1];
        let right = this.bounds[i];
        // console.log(value, this.range, this.level, this.bounds, 'left', left, 'right', right, 1 - r, r);
        // console.log('returns', left * (1 - r) + right * r);
        return left * (1 - r) + right * r;
    }
}
exports.EquiDepthScale = EquiDepthScale;
class ColorScale {
    // An interpolator maps a domain value to [0, 1]
    constructor(colorRange, interpolator, outOfRangeColor) {
        this.colorRange = colorRange;
        this.interpolator = interpolator;
        this.outOfRangeColor = outOfRangeColor;
    }
    map(value) {
        if (isNaN(value) && !this.outOfRangeColor)
            return this.outOfRangeColor;
        return color_1.default.interpolate(this.colorRange[0], this.colorRange[1], this.interpolator.map(value));
    }
}
exports.ColorScale = ColorScale;
class LinearColorScale extends ColorScale {
    constructor(domain, colorRange) {
        super(colorRange, new LinearScale(domain, [0, 1]));
        this.domain = domain;
        this.colorRange = colorRange;
    }
}
exports.LinearColorScale = LinearColorScale;
class LogColorScale extends ColorScale {
    constructor(domain, colorRange, base = Math.E) {
        super(colorRange, new LogScale(domain, [0, 1], base));
        this.domain = domain;
        this.colorRange = colorRange;
        this.base = base;
    }
}
exports.LogColorScale = LogColorScale;
class SquareRootColorScale extends ColorScale {
    constructor(domain, colorRange) {
        super(colorRange, new SquareRootScale(domain, [0, 1]));
        this.domain = domain;
        this.colorRange = colorRange;
    }
}
exports.SquareRootColorScale = SquareRootColorScale;
class CubicRootColorScale extends ColorScale {
    constructor(domain, colorRange) {
        super(colorRange, new CubicRootScale(domain, [0, 1]));
        this.domain = domain;
        this.colorRange = colorRange;
    }
}
exports.CubicRootColorScale = CubicRootColorScale;
class EquiDepthColorScale extends ColorScale {
    constructor(domain, colorRange, level = 32) {
        super(colorRange, new EquiDepthScale(domain, [0, 1], level));
        this.domain = domain;
        this.colorRange = colorRange;
        this.level = level;
    }
    scale() { return this.interpolator; }
}
exports.EquiDepthColorScale = EquiDepthColorScale;
//# sourceMappingURL=scale.js.map
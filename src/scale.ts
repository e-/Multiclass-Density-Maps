import Color from './color';
import { Digest } from 'tdigest';
import { positive, amin, amax, arange } from './util';

export interface ScaleTrait {
    domain: [number, number] | number[];
    range: [number, number] | number[];
    type: string;

    map(value: number): number;
    invmap(value: number): number;
}

export class LinearScale implements ScaleTrait {
    scale: number;
    min: number;
    max: number;
    type = "linear";

    constructor(public domain: [number, number], public range: [number, number],
        clamp: boolean = true) {
        this.scale = (this.range[1] - this.range[0]) / (this.domain[1] - this.domain[0]);
        this.min = amin(this.range);
        this.max = amax(this.range);
    }

    clamp(value: number) {
        if (value < this.min) return this.min;
        if (value > this.max) return this.max;

        return value;
    }

    map(value: number) {
        let ret = (value - this.domain[0]) * this.scale + this.range[0];
        if (this.clamp) return this.clamp(ret);
        return ret;
    }

    invmap(value: number) {
        let dmin = amin(this.domain),
            dmax = amax(this.domain);
        if (value <= this.min) return this.scale > 0 ? dmin : dmax;
        if (value >= this.max) return this.scale > 0 ? dmax : dmin;
        return (value - this.range[0]) / this.scale + this.domain[0];
    }
}

export class LogScale implements ScaleTrait {
    logBase: number;
    internalScale: LinearScale;
    type = "log";

    constructor(public domain: [number, number], public range: [number, number], public base: number = Math.E) {
        this.logBase = Math.log(base);
        this.internalScale = new LinearScale([Math.log(domain[0]) / this.logBase, Math.log(domain[1]) / this.logBase], range);
    }

    map(value: number) {
        if (value === 0) return NaN;
        return this.internalScale.map(Math.log(value) / this.logBase);
    }

    invmap(value: number) {
        return Math.exp(this.internalScale.invmap(value) * this.logBase);
    }
}

export class RootScale implements ScaleTrait {
    internalScale: LinearScale;
    type = "root";

    constructor(public domain: [number, number], public range: [number, number], public degree: number = 2) {
        this.internalScale = new LinearScale([Math.pow(domain[0], 1 / degree), Math.pow(domain[1], 1 / degree)], range);
    }

    map(value: number) {
        return this.internalScale.map(Math.pow(value, 1 / this.degree));
    }

    invmap(value: number) {
        return Math.pow(this.internalScale.invmap(value), this.degree);
    }
}

export class SquareRootScale extends RootScale {
    type = "sqrt";

    constructor(public domain: [number, number], public range: [number, number]) {
        super(domain, range, 2);
    }
}

export class CubicRootScale extends RootScale {
    type = "cbrt";

    constructor(public domain: [number, number], public range: [number, number]) {
        super(domain, range, 3);
    }
}

export class EquiDepthScale implements ScaleTrait {
    type = "equidepth";
    digest: Digest;
    bounds: number[] = [];
    minBound: number = 0;

    constructor(public domain: number[], public range: [number, number], public level: number = 32) {
        this.digest = new Digest();
        this.addPoints(domain); // initialize with something
    }

    addPoints(points: number[]) { this.digest.push(points.filter(positive)); }
    addPoint(point: number) {
        if (positive(point))
            this.digest.push(point);
    }

    computeBounds() {
        this.digest.compress();
        let n = this.level; //-1;
        this.minBound = this.digest.percentile(0);
        this.bounds = this.digest.percentile(arange(n).map(i => ((i + 1) / n)));
    }

    getBounds() {
        if (this.bounds.length == 0) {
            this.computeBounds();
        }
        return this.bounds;
    }

    map(value: number) {

        // linear search is faster than binary search for that simple case
        // https://hannes.muehleisen.org/damon2017-simd-imprints.pdf
        let min = this.range[0];
        if (value <= this.domain[0])
            return min;
        if (value >= this.domain[1])
            return this.range[1];

        let n = this.level - 1,
            w = this.range[1] - min;

        this.getBounds();
        for (let i = 0; i < n; i++)
            if (value < this.bounds[i]) return min + w / n * i;

        return min + w;
    }

    invmap(value: number) {
        this.getBounds();


        if (value < this.range[0]) return this.minBound;
        if (value > this.range[1]) return this.bounds[this.level - 1];

        let v = (value - this.range[0]) / (this.range[1] - this.range[0]) * this.level,
            i = Math.floor(v),
            r = v - i;

        let left = i === 0 ? this.minBound : this.bounds[i - 1];
        let right = this.bounds[i];

        // console.log(value, this.range, this.level, this.bounds, 'left', left, 'right', right, 1 - r, r);
        // console.log('returns', left * (1 - r) + right * r);
        return left * (1 - r) + right * r;
    }
}

export interface ColorScaleTrait {
    map(value: number): Color;
}

export class ColorScale implements ColorScaleTrait {
    // An interpolator maps a domain value to [0, 1]
    constructor(public colorRange: [Color, Color], public interpolator: ScaleTrait, public outOfRangeColor?: Color) {
    }

    map(value: number) {
        if (isNaN(value) && !this.outOfRangeColor) return this.outOfRangeColor!;
        return Color.interpolate(this.colorRange[0], this.colorRange[1], this.interpolator.map(value));
    }
}

export class LinearColorScale extends ColorScale {
    constructor(public domain: [number, number], public colorRange: [Color, Color]) {
        super(colorRange, new LinearScale(domain, [0, 1]));
    }
}

export class LogColorScale extends ColorScale {
    constructor(public domain: [number, number], public colorRange: [Color, Color], public base: number = Math.E) {
        super(colorRange, new LogScale(domain, [0, 1], base));
    }
}

export class SquareRootColorScale extends ColorScale {
    constructor(public domain: [number, number], public colorRange: [Color, Color]) {
        super(colorRange, new SquareRootScale(domain, [0, 1]));
    }
}

export class CubicRootColorScale extends ColorScale {
    constructor(public domain: [number, number], public colorRange: [Color, Color]) {
        super(colorRange, new CubicRootScale(domain, [0, 1]));
    }
}

export class EquiDepthColorScale extends ColorScale {
    constructor(public domain: number[], public colorRange: [Color, Color], public level: number = 32) {
        super(colorRange, new EquiDepthScale(domain, [0, 1], level));
    }
    scale(): EquiDepthScale { return <EquiDepthScale>this.interpolator; }
}

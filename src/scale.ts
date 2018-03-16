import Color from './color';
import {Digest} from 'tdigest';
import {positive} from './util';

export interface ScaleTrait {
    domain: [number, number] | number[];
    range: [number, number] | number[];
    map(value:number):number;
}

export class LinearScale implements ScaleTrait {
    scale:number;
    min:number;
    max:number;

    constructor(public domain: [number, number], public range: [number, number],
                clamp:boolean = true) {
        this.scale = (this.range[1] - this.range[0]) / (this.domain[1] - this.domain[0]);
        this.min = Math.min.apply(Math, this.range);
        this.max = Math.max.apply(Math, this.range);
    }

    clamp(value:number) {
        if(value < this.min) return this.min;
        if(value > this.max) return this.max;

        return value;
    }

    map(value:number) {
        let ret = (value - this.domain[0]) * this.scale + this.range[0];
        if(this.clamp) return this.clamp(ret);
        return ret;
    }
}

export class LogScale implements ScaleTrait {
    logBase: number;
    internalScale: LinearScale;

    constructor(public domain: [number, number], public range: [number, number], public base:number = Math.E) {
        this.logBase = Math.log(base);
        this.internalScale = new LinearScale([Math.log(domain[0]) / this.logBase, Math.log(domain[1]) / this.logBase], range);
    }

    map(value:number) {
        return this.internalScale.map(Math.log(value) / this.logBase);
    }
}

export class RootScale implements ScaleTrait {
    internalScale: LinearScale;

    constructor(public domain: [number, number], public range: [number, number], public degree: number = 2) {
        this.internalScale = new LinearScale([Math.pow(domain[0], 1 / degree), Math.pow(domain[1], 1 / degree)], range);
    }

    map(value:number) {
        return this.internalScale.map(Math.pow(value, 1 / this.degree));
    }
}

export class SquareRootScale extends RootScale {
    constructor(public domain: [number, number], public range: [number, number]) {
        super(domain, range, 2);
    }
}

export class CubicRootScale extends RootScale {
    constructor(public domain: [number, number], public range: [number, number]) {
        super(domain, range, 3);
    }
}

function arange(n:number): number[] {
    return new Array(n).fill(0).map((d, i) => i);
}

export class EquiDepthScale implements ScaleTrait {
    digest:Digest;
    bounds:number[] = [];

    constructor(public domain: number[], public range: [number, number], public level:number = 32) {
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
        let n = this.level-1;
        this.bounds = this.digest.percentile(arange(n).map(i => ((i+1)/ n)));
    }

    map(value:number) { // TODO: use binary search? no [slower according to Manegold]
        let min = this.range[0];

        if (value == 0) return min; // shortcut

        let n   = this.level-1,
            w   = this.range[1] - min,
            max = this.bounds[n];

        if (this.bounds.length==0) {
            this.computeBounds();
        }

        for(let i = 0; i < n; i++)
            if (value < this.bounds[i]) return min+w*i/n;
        return min+w;
    }
}

export interface ColorScaleTrait {
    map(value:number):Color;
}

export class ColorScale implements ColorScaleTrait {
    // An interpolator maps a domain value to [0, 1]
    constructor(public colorRange:[Color, Color], public interpolator:ScaleTrait) {
    }

    map(value:number) {
        return Color.interpolate(this.colorRange[0], this.colorRange[1], this.interpolator.map(value));
    }
}

export class LinearColorScale extends ColorScale {
    constructor(public domain:[number, number], public colorRange:[Color, Color]) {
        super(colorRange, new LinearScale(domain, [0, 1]));
    }
}

export class LogColorScale extends ColorScale {
    constructor(public domain:[number, number], public colorRange:[Color, Color], public base:number=Math.E) {
        super(colorRange, new LogScale(domain, [0, 1], base));
    }
}

export class SquareRootColorScale extends ColorScale {
    constructor(public domain:[number, number], public colorRange:[Color, Color]) {
        super(colorRange, new SquareRootScale(domain, [0, 1]));
    }
}

export class CubicRootColorScale extends ColorScale {
    constructor(public domain:[number, number], public colorRange:[Color, Color]) {
        super(colorRange, new CubicRootScale(domain, [0, 1]));
    }
}

export class EquiDepthColorScale extends ColorScale {
    constructor(public domain:number[], public colorRange:[Color, Color], public level:number = 32) {
        super(colorRange, new EquiDepthScale(domain, [0, 1], level));
    }
    scale():EquiDepthScale { return <EquiDepthScale>this.interpolator; }
}

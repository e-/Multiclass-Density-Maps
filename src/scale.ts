interface ScaleTrait {
    map(value:number):number;
}

export class Scale {

}

export class LinearScale implements ScaleTrait {
    constructor(public domain: [number, number], public range: [number, number]) {

    }

    map(value:number) {
        return this.range[0] + (this.range[1] - this.range[0]) / (this.domain[1] - this.domain[0]) * (value - this.domain[0]);
    }
}

export class LogScale implements ScaleTrait {
    logBase: number;
    internalScale: LinearScale;

    constructor(public domain: [number, number], public range: [number, number], public base:number = 10) {
        this.logBase = Math.log(base);
        this.internalScale = new LinearScale(domain, [Math.log(range[0]) / this.logBase, Math.log(range[1]) / this.logBase ]);
    }

    map(value:number) {
        return Math.exp(this.internalScale.map(value) * this.logBase);
    }
}

export class NaturalLogScale extends LogScale {
    constructor(public domain: [number, number], public range: [number, number]) {
        super(domain, range, Math.E);
    }
}

export class RootScale implements ScaleTrait {
    internalScale: LinearScale;

    constructor(public domain: [number, number], public range: [number, number], public degree: number = 2) {
        this.internalScale = new LinearScale(domain, [Math.pow(range[0], 1 / degree), Math.pow(range[1], 1 / degree)]);
    }

    map(value:number) {
        return Math.pow(this.internalScale.map(value), this.degree);
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
    bounds:number[];

    constructor(public domain: number[], public level:number = 10) {
        let sorted = domain.slice();
        sorted.sort();
        this.bounds = arange(level - 1).map(i => sorted[Math.floor((i + 1) / level * domain.length)]);
    }

    map(value:number) { // TODO: use binary search?
        for(let i = 0; i < this.level - 1; i++) {
            if(value < this.bounds[i]) return i;
        }
        return this.level - 1;
    }
}

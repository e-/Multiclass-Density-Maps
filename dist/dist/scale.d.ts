import Color from './color';
import { Digest } from 'tdigest';
export interface ScaleTrait {
    domain: [number, number] | number[];
    range: [number, number] | number[];
    map(value: number): number;
    invmap(value: number): number;
}
export declare class LinearScale implements ScaleTrait {
    domain: [number, number];
    range: [number, number];
    scale: number;
    min: number;
    max: number;
    constructor(domain: [number, number], range: [number, number], clamp?: boolean);
    clamp(value: number): number;
    map(value: number): number;
    invmap(value: number): number;
}
export declare class LogScale implements ScaleTrait {
    domain: [number, number];
    range: [number, number];
    base: number;
    logBase: number;
    internalScale: LinearScale;
    constructor(domain: [number, number], range: [number, number], base?: number);
    map(value: number): number;
    invmap(value: number): number;
}
export declare class RootScale implements ScaleTrait {
    domain: [number, number];
    range: [number, number];
    degree: number;
    internalScale: LinearScale;
    constructor(domain: [number, number], range: [number, number], degree?: number);
    map(value: number): number;
    invmap(value: number): number;
}
export declare class SquareRootScale extends RootScale {
    domain: [number, number];
    range: [number, number];
    constructor(domain: [number, number], range: [number, number]);
}
export declare class CubicRootScale extends RootScale {
    domain: [number, number];
    range: [number, number];
    constructor(domain: [number, number], range: [number, number]);
}
export declare class EquiDepthScale implements ScaleTrait {
    domain: number[];
    range: [number, number];
    level: number;
    digest: Digest;
    bounds: number[];
    constructor(domain: number[], range: [number, number], level?: number);
    addPoints(points: number[]): void;
    addPoint(point: number): void;
    computeBounds(): void;
    getBounds(): number[];
    map(value: number): number;
    invmap(value: number): number;
}
export interface ColorScaleTrait {
    map(value: number): Color;
}
export declare class ColorScale implements ColorScaleTrait {
    colorRange: [Color, Color];
    interpolator: ScaleTrait;
    outOfRangeColor: Color | undefined;
    constructor(colorRange: [Color, Color], interpolator: ScaleTrait, outOfRangeColor?: Color | undefined);
    map(value: number): Color;
}
export declare class LinearColorScale extends ColorScale {
    domain: [number, number];
    colorRange: [Color, Color];
    constructor(domain: [number, number], colorRange: [Color, Color]);
}
export declare class LogColorScale extends ColorScale {
    domain: [number, number];
    colorRange: [Color, Color];
    base: number;
    constructor(domain: [number, number], colorRange: [Color, Color], base?: number);
}
export declare class SquareRootColorScale extends ColorScale {
    domain: [number, number];
    colorRange: [Color, Color];
    constructor(domain: [number, number], colorRange: [Color, Color]);
}
export declare class CubicRootColorScale extends ColorScale {
    domain: [number, number];
    colorRange: [Color, Color];
    constructor(domain: [number, number], colorRange: [Color, Color]);
}
export declare class EquiDepthColorScale extends ColorScale {
    domain: number[];
    colorRange: [Color, Color];
    level: number;
    constructor(domain: number[], colorRange: [Color, Color], level?: number);
    scale(): EquiDepthScale;
}

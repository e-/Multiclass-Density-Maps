import Path from './path';
export default class Mask {
    width: number;
    height: number;
    path?: Path;
    private maskCanvas?;
    mask: Uint8ClampedArray[];
    constructor(width: number, height: number, default_value?: number, buffer?: ArrayBuffer, offset?: number);
    rowcounts(step?: number): number[];
    pixcount(step?: number): number;
    area(): number;
    randomPoint(rowcounts?: number[]): number[];
    getCanvas(): HTMLCanvasElement;
    getPath(): Path;
    copyFrom(ctx: CanvasRenderingContext2D): void;
    copyTo(ctx: CanvasRenderingContext2D): void;
}

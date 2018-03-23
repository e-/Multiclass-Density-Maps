export declare function positive(x: number): boolean;
export declare function create2D<T>(width: number, height: number, value: T): T[][];
export declare function asum(values: number[]): number;
export declare function amax(values: number[]): number;
export declare function amin(values: number[]): number;
export declare function arange(start: number, end?: number, step?: number): number[];
export declare function get(url: string): Promise<any>;
export { default as largeRectInPoly } from './largest-rect-in-poly';

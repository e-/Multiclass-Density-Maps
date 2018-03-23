import DerivedBuffer from './derived-buffer';
import Color from './color';
import Tile from './tile';
export default class Composer {
    static max(buffers: DerivedBuffer[], values: number[]): Color;
    static min(buffers: DerivedBuffer[], values: number[]): Color;
    static mean(buffers: DerivedBuffer[], values: number[]): Color;
    static additiveMix(buffers: DerivedBuffer[], values: number[]): Color;
    static multiplicativeMix(buffers: DerivedBuffer[], values: number[]): Color;
    static none(buffers: DerivedBuffer[], values: number[]): Color;
    static one(buffer: DerivedBuffer, value: number): Color;
    static bars(buffers: DerivedBuffer[], values: number[], options?: {
        width?: number;
        height?: number;
        'y.scale.domain': [number, number];
        'y.scale.type'?: string;
        'y.scale.base'?: number;
    }): Promise<HTMLCanvasElement>;
    static punchcard(buffers: DerivedBuffer[], values: number[], options?: {
        width?: number;
        height?: number;
        'z.scale.domain'?: [number, number];
        'z.scale.type'?: string;
        'z.scale.base'?: number;
        cols?: number;
        factor?: number;
    }): Promise<HTMLCanvasElement>;
    static hatch(tile: Tile, buffers: DerivedBuffer[], dataValues: number[], thickness: number, widthprop: string | number, colprop?: boolean): HTMLCanvasElement;
}

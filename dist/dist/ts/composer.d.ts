import DerivedBuffer from "./derived-buffer";
import Color from "./color";
import Tile from "./tile";
export default class Composer {
    static max(buffers: DerivedBuffer[], values: number[]): Color;
    static invmin(buffers: DerivedBuffer[], values: number[], threshold?: number): Color;
    static mean(buffers: DerivedBuffer[], values: number[]): Color;
    static additiveMix(buffers: DerivedBuffer[], values: number[]): Color;
    static multiplicativeMix(buffers: DerivedBuffer[], values: number[]): Color;
    static none(buffers: DerivedBuffer[], values: number[]): Color;
    static one(buffer: DerivedBuffer, value: number): Color;
    static bars(buffers: DerivedBuffer[], names: string[], values: number[], options?: {
        width?: number;
        height?: number;
        "y.scale.domain": [number, number];
        "y.scale.type"?: string;
        "y.scale.base"?: number;
        "y.scale.exponent"?: number;
    }): Promise<HTMLCanvasElement>;
    static punchcard(buffers: DerivedBuffer[], names: string[], values: number[], options?: {
        width?: number;
        height?: number;
        "z.scale.domain"?: [number, number];
        "z.scale.type"?: string;
        "z.scale.base"?: number;
        cols?: number;
        factor?: number;
    }): Promise<HTMLCanvasElement>;
    static hatch(tile: Tile, buffers: DerivedBuffer[], dataValues: number[], options: {
        thickness: number;
        sort: boolean;
        widthprop?: 'percent' | number;
        colprop: boolean;
    }): HTMLCanvasElement;
}

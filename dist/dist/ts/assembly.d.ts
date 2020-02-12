import ClassBuffer from "./class-buffer";
import Color from "./color";
import Tile from "./tile";
export default class Assembly {
    static max(buffers: ClassBuffer[], values: number[]): Color;
    static invmin(buffers: ClassBuffer[], values: number[], threshold?: number): Color;
    static mean(buffers: ClassBuffer[], values: number[]): Color;
    static add(buffers: ClassBuffer[], values: number[]): Color;
    static multiply(buffers: ClassBuffer[], values: number[]): Color;
    static none(): Color;
    static one(buffer: ClassBuffer, value: number): Color;
    static bars(buffers: ClassBuffer[], values: number[], options?: {
        width?: number;
        height?: number;
        "y.scale.domain": [number, number];
        "y.scale.type"?: string;
        "y.scale.base"?: number;
        "y.scale.exponent"?: number;
    }): Promise<HTMLCanvasElement>;
    static punchcard(buffers: ClassBuffer[], names: string[], values: number[], options?: {
        width?: number;
        height?: number;
        "z.scale.domain"?: [number, number];
        "z.scale.type"?: string;
        "z.scale.base"?: number;
        cols?: number;
        factor?: number;
    }): Promise<HTMLCanvasElement>;
    static hatch(tile: Tile, buffers: ClassBuffer[], dataValues: number[], options: {
        thickness: number;
        sort: boolean;
        widthprop?: 'percent' | number;
        colprop: boolean;
    }): HTMLCanvasElement;
}

import * as d3 from 'd3-contour';
export default class DataBuffer {
    name: string;
    width: number;
    height: number;
    values: Float32Array[];
    constructor(name: string, width: number, height: number, values?: number[][]);
    buffer(): ArrayBuffer;
    linearize(): number[];
    min(): number;
    max(): number;
    rescale(scale: number): void;
    blur(radius?: number): DataBuffer;
    contours(thresholds?: number[], blur?: number): d3.ContourMultiPolygon[];
}

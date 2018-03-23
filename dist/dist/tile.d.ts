import Point from './point';
import DataBuffer from './data-buffer';
import Mask from './mask';
import Rect from './rect';
export declare enum TileAggregation {
    Min = 0,
    Mean = 1,
    Sum = 2,
    Max = 3,
}
export default class Tile extends Point {
    mask: Mask;
    center: Point;
    dataValues: number[];
    constructor(x: number, y: number, mask: Mask, center?: Point);
    area(): number;
    rowcounts(): number[];
    maxValue(): number;
    sumValue(): number;
    aggregateOne(buffer: DataBuffer, op?: TileAggregation): number;
    aggregate(buffers: DataBuffer[], op?: TileAggregation): number[];
    getRectAtCenter(): Rect | null;
}

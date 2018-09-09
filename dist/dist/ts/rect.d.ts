import Point from './point';
export default class Rect {
    min: Point;
    max: Point;
    constructor(min: Point, max: Point);
    center(): Point;
    width(): number;
    height(): number;
}

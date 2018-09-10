import Point from './point';

export default class Rect {
    constructor(public min: Point, public max: Point) {

    }

    center() {
        return new Point((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
    }

    width() {
        return Math.abs(this.max.x - this.min.x);
    }

    height() {
        return Math.abs(this.max.y - this.min.y);
    }
}

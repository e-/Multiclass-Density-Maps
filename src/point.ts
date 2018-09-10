export default class Point {
    constructor(public x: number, public y: number) {

    }

    round() {
        return new Point(Math.round(this.x), Math.round(this.y));
    }
}

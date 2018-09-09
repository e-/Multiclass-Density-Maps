"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    round() {
        return new Point(Math.round(this.x), Math.round(this.y));
    }
}
exports.default = Point;
//# sourceMappingURL=point.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const point_1 = __importDefault(require("./point"));
class Rect {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    center() {
        return new point_1.default((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
    }
    width() {
        return Math.abs(this.max.x - this.min.x);
    }
    height() {
        return Math.abs(this.max.y - this.min.y);
    }
}
exports.default = Rect;
//# sourceMappingURL=rect.js.map
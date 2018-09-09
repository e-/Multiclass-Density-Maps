"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Path {
    constructor() {
        this.codes = '';
        this.pts = [];
    }
    moveTo(x, y) {
        this.codes += "M";
        this.x0 = this.x1 = x;
        this.y0 = this.y1 = y;
        this.pts.push([x, y]);
    }
    closePath() {
        if (this.x1 !== undefined) {
            this.codes += "Z";
            this.x1 = this.x0;
            this.y1 = this.y0;
            this.pts.push([this.x0, this.y0]);
        }
    }
    lineTo(x, y) {
        this.codes += "L";
        this.x1 = x;
        this.y1 = y;
        this.pts.push([x, y]);
    }
    quadraticCurveTo(x1, y1, x, y) {
        this.codes += "Q";
        this.x1 = x;
        this.y1 = y;
        this.pts.push([x1, y1]);
        this.pts.push([x, y]);
    }
    bezierCurveTo(x1, y1, x2, y2, x, y) {
        this.codes += "C";
        this.x1 = x;
        this.y1 = y;
        this.pts.push([x1, y1]);
        this.pts.push([x2, y2]);
        this.pts.push([x, y]);
    }
    arcTo(x1, y1, x2, y2, r) {
        throw new Error("Unsupported method");
    }
    arc(x, y, r, a0, a1, ccw) {
        throw new Error("Unsupported method");
    }
    rect(x, y, w, h) {
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.closePath();
    }
    send(canvas) {
        var j = 0;
        for (let i = 0; i < this.codes.length; i++) {
            let c = this.codes[i];
            if (c == 'M') {
                canvas.moveTo(this.pts[j][0], this.pts[j][1]);
                j++;
            }
            else if (c == 'Z') {
                canvas.closePath();
                j++;
            }
            else if (c == 'L') {
                canvas.lineTo(this.pts[j][0], this.pts[j][1]);
                j++;
            }
            else if (c == 'Q') {
                canvas.quadraticCurveTo(this.pts[j][0], this.pts[j][1], this.pts[j + 1][0], this.pts[j + 1][1]);
                j += 2;
            }
            else if (c == 'C') {
                canvas.bezierCurveTo(this.pts[j][0], this.pts[j][1], this.pts[j + 1][0], this.pts[j + 1][1], this.pts[j + 2][0], this.pts[j + 2][1]);
                j += 3;
            }
            else {
                console.log('Error, unknown code ' + c);
            }
        }
    }
}
exports.default = Path;
//# sourceMappingURL=path.js.map
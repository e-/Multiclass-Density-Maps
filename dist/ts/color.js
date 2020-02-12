"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Color {
    constructor(r = 1, g = 1, b = 1, a = 0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    set(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    clamp() {
        return new Color(Math.min(Math.max(this.r, 0), 1), Math.min(Math.max(this.g, 0), 1), Math.min(Math.max(this.b, 0), 1), Math.min(Math.max(this.a, 0), 1));
    }
    isValid() {
        if (isNaN(this.r) ||
            isNaN(this.g) ||
            isNaN(this.b) ||
            isNaN(this.a))
            return false;
        if (this.r < 0 || this.r > 1 ||
            this.g < 0 || this.g > 1 ||
            this.b < 0 || this.b > 1 ||
            this.a < 0 || this.a > 1)
            return false;
        return true;
    }
    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
    rdissolve(v) {
        this.r *= v;
        this.g *= v;
        this.b *= v;
        this.a *= v;
    }
    toString() {
        return `Color(${this.r},${this.g},${this.b},${this.a})`;
    }
    cssDepremultiply() {
        let a = this.a;
        if (a == 0)
            return "rgba(0,0,0,0)";
        let r = this.r / a, g = this.g / a, b = this.b / a;
        return "rgba(" +
            Math.floor(255 * r) + "," +
            Math.floor(255 * g) + "," +
            Math.floor(255 * b) + "," +
            Math.round(100 * a) / 100 + ")";
    }
    css() {
        let a = this.a;
        /*if (a == 0)
            return "rgba(0,0,0,0)";*/
        let r = this.r, g = this.g, b = this.b;
        return "rgba(" +
            Math.floor(255 * r) + "," +
            Math.floor(255 * g) + "," +
            Math.floor(255 * b) + "," +
            Math.round(100 * a) / 100 + ")";
    }
    add(c) {
        return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a);
    }
    radd(c) {
        this.r += c.r;
        this.g += c.g;
        this.b += c.b;
        this.a += c.a;
    }
    darker() {
        return new Color(this.r / 2, this.g / 2, this.b / 2, this.a);
    }
    totTransparent() {
        return new Color(this.r, this.g, this.b, 0.0);
    }
    brighter() {
        return new Color(1 - (1 - this.r) / 2, 1 - (1 - this.g) / 2, 1 - (1 - this.b) / 2, this.a);
    }
    static compose(a, fa, b, fb) {
        return new Color(a.r * fa + b.r * fb, a.g * fa + b.g * fb, a.b * fa + b.b * fb, a.a * fa + b.a * fb);
    }
    static interpolate(a, b, r) {
        return Color.compose(a, 1 - r, b, r);
    }
    static rgba(code) {
        if (code.startsWith('rgba')) {
            let res = code.split(/[(,)]/);
            if (res.length >= 5) {
                let r = parseFloat(res[1]);
                let g = parseFloat(res[2]);
                let b = parseFloat(res[3]);
                let a = parseFloat(res[4]);
                return new Color(r / 255, g / 255, b / 255, a);
            }
        }
        else if (code.startsWith('rgb')) {
            let res = code.split(/[(,)]/);
            if (res.length >= 4) {
                let r = parseFloat(res[1]);
                let g = parseFloat(res[2]);
                let b = parseFloat(res[3]);
                return new Color(r / 255, g / 255, b / 255, 1);
            }
        }
        else if (code.startsWith('#')) {
            // taken from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
            let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            let fullCode = code.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullCode);
            if (result && result.length >= 4) {
                return new Color(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255, 1);
            }
        }
        return Color.None;
    }
    static parse(name) {
        name = name.toLowerCase();
        if (name in Color.ColorByName)
            return Color.ColorByName[name];
        return this.rgba(name);
    }
    ;
}
Color.None = new Color(0, 0, 0, 0);
Color.White = new Color(1, 1, 1, 1);
Color.Black = new Color(0, 0, 0, 1);
Color.Blue = new Color(31 / 255, 120 / 255, 180 / 255, 1); // Blue
Color.Orange = new Color(255 / 255, 127 / 255, 0 / 255, 1); // orange
Color.Green = new Color(51 / 255, 160 / 255, 44 / 255, 1); // green
Color.Red = new Color(211 / 255, 39 / 255, 40 / 255, 1);
Color.Purple = new Color(148 / 255, 103 / 255, 189 / 255, 1);
Color.Brown = new Color(140 / 255, 86 / 255, 75 / 255, 1);
Color.Pink = new Color(227 / 255, 119 / 255, 194 / 255, 1);
Color.Gray = new Color(127 / 255, 127 / 255, 127 / 255, 1);
Color.Yellow = new Color(255 / 255, 240 / 255, 65 / 255, 1);
Color.Cyan = new Color(0 / 255, 190 / 255, 255 / 255, 1);
Color.Magenta = new Color(241 / 255, 31 / 255, 141 / 255, 1);
Color.Skyblue = new Color(23 / 255, 190 / 255, 207 / 255, 1);
Color.Transparent = new Color(0, 0, 0, 0);
Color.ColorByName = {
    "None": Color.None,
    "white": Color.White,
    "Black": Color.Black,
    "blue": Color.Blue,
    "orange": Color.Orange,
    "green": Color.Green,
    "red": Color.Red,
    "purple": Color.Purple,
    "brown": Color.Brown,
    "pink": Color.Pink,
    "gray": Color.Gray,
    "yellow": Color.Yellow,
    "cyan": Color.Cyan,
    "magenta": Color.Magenta,
    "skyblue": Color.Skyblue
};
Color.Category10 = [Color.Blue, Color.Orange, Color.Green, Color.Red, Color.Purple, Color.Brown, Color.Pink, Color.Gray, Color.Yellow, Color.Skyblue];
Color.Category10t = Color.Category10.map(c => new Color(c.r, c.g, c.b, 0));
Color.Category10a = [Color.Blue, Color.Red, Color.Green, Color.Orange, Color.Purple, Color.Brown, Color.Pink, Color.Gray, Color.Yellow, Color.Skyblue];
Color.Category10b = [Color.Red, Color.Yellow, Color.Blue, Color.Orange, Color.Purple, Color.Green, Color.Pink, Color.Gray, Color.Yellow, Color.Skyblue];
exports.default = Color;
//# sourceMappingURL=color.js.map
export default class Color {
    constructor(public r: number = 1, public g: number = 1, public b: number = 1, public a: number = 0) {

    }

    set(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    clamp() {
        return new Color(
            Math.min(Math.max(this.r, 0), 1),
            Math.min(Math.max(this.g, 0), 1),
            Math.min(Math.max(this.b, 0), 1),
            Math.min(Math.max(this.a, 0), 1)
        );
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

    rdissolve(v: number) {
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

    add(c: Color) {
        return new Color(
            this.r + c.r,
            this.g + c.g,
            this.b + c.b,
            this.a + c.a
        );
    }

    radd(c: Color) {
        this.r += c.r;
        this.g += c.g;
        this.b += c.b;
        this.a += c.a;
    }

    darker() {
        return new Color(
            this.r / 2,
            this.g / 2,
            this.b / 2,
            this.a
        );
    }

    totTransparent() {
        return new Color(
            this.r,
            this.g,
            this.b,
            0.0
        );
    }

    brighter() {
        return new Color(
            1 - (1 - this.r) / 2,
            1 - (1 - this.g) / 2,
            1 - (1 - this.b) / 2,
            this.a
        );
    }

    static compose(a: Color, fa: number, b: Color, fb: number) {
        return new Color(
            a.r * fa + b.r * fb,
            a.g * fa + b.g * fb,
            a.b * fa + b.b * fb,
            a.a * fa + b.a * fb
        );
    }

    static interpolate(a: Color, b: Color, r: number) {
        return Color.compose(a, 1 - r, b, r);
    }

    static None = new Color(0, 0, 0, 0);
    static White = new Color(1, 1, 1, 1);
    static Black = new Color(0, 0, 0, 1);
    static Blue = new Color(31 / 255, 120 / 255, 180 / 255, 1); // Blue
    static Orange = new Color(255 / 255, 127 / 255, 0 / 255, 1); // orange
    static Green = new Color(51 / 255, 160 / 255, 44 / 255, 1); // green
    static Red = new Color(211 / 255, 39 / 255, 40 / 255, 1);
    static Purple = new Color(148 / 255, 103 / 255, 189 / 255, 1);
    static Brown = new Color(140 / 255, 86 / 255, 75 / 255, 1);
    static Pink = new Color(227 / 255, 119 / 255, 194 / 255, 1);
    static Gray = new Color(127 / 255, 127 / 255, 127 / 255, 1);
    static Yellow = new Color(255 / 255, 240 / 255, 65 / 255, 1);
    static Cyan = new Color(0 / 255, 190 / 255, 255 / 255, 1);
    static Magenta = new Color(241 / 255, 31 / 255, 141 / 255, 1);
    static Skyblue = new Color(23 / 255, 190 / 255, 207 / 255, 1);
    static Transparent = new Color(0, 0, 0, 0);

    static ColorByName: any = {
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

    static rgb(code: string) {
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

            let result: RegExpExecArray | null = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullCode);
            if (result && result.length >= 4) {
                return new Color(
                    parseInt(result[1], 16) / 255,
                    parseInt(result[2], 16) / 255,
                    parseInt(result[3], 16) / 255,
                    1
                );
            }
        }
        return Color.None;
    }

    static get(name: string): Color {
        name = name.toLowerCase();
        if (name in Color.ColorByName)
            return <Color>Color.ColorByName[name];

        return this.rgb(name);
    };


    static Category10 = [Color.Blue, Color.Orange, Color.Green, Color.Red, Color.Purple, Color.Brown, Color.Pink, Color.Gray, Color.Yellow, Color.Skyblue];
    static Category10t = Color.Category10.map(c => new Color(c.r, c.g, c.b, 0));
    static Category10a = [Color.Blue, Color.Red, Color.Green, Color.Orange, Color.Purple, Color.Brown, Color.Pink, Color.Gray, Color.Yellow, Color.Skyblue];
    static Category10b = [Color.Red, Color.Yellow, Color.Blue, Color.Orange, Color.Purple, Color.Green, Color.Pink, Color.Gray, Color.Yellow, Color.Skyblue];
}

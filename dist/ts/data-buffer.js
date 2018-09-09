"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util = __importStar(require("./util"));
const gaussian_blur_1 = __importDefault(require("./gaussian-blur"));
const d3 = __importStar(require("d3-contour"));
class DataBuffer {
    constructor(name, width, height, values) {
        this.name = name;
        this.width = width;
        this.height = height;
        let buffer = new ArrayBuffer(width * height * 4); // sizeof float32
        this.values = Array(height);
        for (let i = 0; i < height; i++) {
            this.values[i] = new Float32Array(buffer, i * width * 4, width);
            if (values)
                this.values[i].set(values[i]);
        }
    }
    buffer() { return this.values[0].buffer; }
    linearize() {
        // return Array.prototype.concat.apply(this.values[0],
        //                                     this.values.slice(1));
        // return Array.prototype.slice.call(new Float32Array(this.values[0].buffer));
        // Fool the type system of TS that prevents returning the Float32Array directly
        return new Float32Array(this.buffer());
    }
    // copy() {
    //     return new DataBuffer(this.name, this.width, this.height, <any>this.values);
    // }
    // equals(other:DataBuffer) {
    //     let b1 = this.linearize();
    //     let b2 = other.linearize();
    //     if (b1.length != b2.length) return false;
    //     for (let i = 0; i < b1.length; i++)
    //         if (b1[i] !== b2[i]) return false;
    //     return true;
    // }
    min() {
        return util.amin(this.linearize());
    }
    max() {
        return util.amax(this.linearize());
    }
    rescale(scale) {
        let arr = this.linearize();
        for (let i = 0; i < arr.length; i++)
            arr[i] *= scale;
    }
    blur(radius = 3) {
        if (radius == 0)
            return this;
        // Linearize the array
        let source = this.linearize().slice(0), // copy
        dest = new DataBuffer(this.name, this.width, this.height), target = new Float32Array(dest.buffer());
        gaussian_blur_1.default(source, target, this.width, this.height, radius);
        return dest;
    }
    contours(thresholds, blur = 1) {
        let contours = d3.contours().size([this.width, this.height]);
        var values = this.linearize();
        if (blur != 0) {
            let target = new Float32Array(this.width * this.height);
            gaussian_blur_1.default(values, target, this.width, this.height, blur);
            values = target;
        }
        if (thresholds != undefined)
            contours.thresholds(thresholds);
        return contours(values);
    }
}
exports.default = DataBuffer;
//# sourceMappingURL=data-buffer.js.map
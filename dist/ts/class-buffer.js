"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = __importDefault(require("./color"));
const util = __importStar(require("./util"));
const Scale = __importStar(require("./scale"));
class ClassBuffer {
    constructor(dataBuffer) {
        this.dataBuffer = dataBuffer;
        this.colorScale = new Scale.LinearColorScale([0, 1], [color_1.default.White, color_1.default.Black]);
        this.color0 = color_1.default.None;
        this.color1 = color_1.default.None;
        this.angle = 0;
        this.name = dataBuffer.name;
    }
    thresholds(n) {
        if (n <= 0)
            return [];
        let scaleTrait = this.colorScale.interpolator;
        return util.arange(scaleTrait.range[0], scaleTrait.range[1], (scaleTrait.range[1] - scaleTrait.range[0]) / (n + 2))
            .slice(1, n + 1)
            .map(v => scaleTrait.invmap(v));
    }
    contours(thresholds, blur = 3) {
        return this.dataBuffer.contours(thresholds, blur);
    }
}
exports.default = ClassBuffer;
//# sourceMappingURL=class-buffer.js.map
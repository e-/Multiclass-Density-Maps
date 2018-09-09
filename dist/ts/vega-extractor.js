"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vega_embed_1 = __importDefault(require("vega-embed"));
function extract(spec) {
    let wrapper = document.createElement('div');
    return vega_embed_1.default(wrapper, spec, {
        actions: false
    }).then(() => {
        let canvas = wrapper.getElementsByTagName('canvas')[0];
        let ctx = canvas.getContext('2d');
        return canvas;
    });
}
exports.default = extract;
//# sourceMappingURL=vega-extractor.js.map
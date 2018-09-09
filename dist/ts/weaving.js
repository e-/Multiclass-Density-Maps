"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mask_1 = __importDefault(require("./mask"));
function squareMasks(m, size, width, height, xincr = 1) {
    let masks = Array(m);
    size = Math.floor(size);
    if (xincr < 0) {
        xincr = m + (xincr % m);
    }
    for (let i = 0; i < m; i++) {
        masks[i] = new mask_1.default(width, height, 0);
    }
    for (let i = 0; i < (height / size); i++) {
        let row = i * size;
        let row_max = Math.min(row + size, height);
        for (let j = 0; j < (width / size); j++) {
            let col = j * size;
            let col_max = Math.min(col + size, width);
            let selected = (i * xincr + j);
            let mask = masks[selected % m];
            for (let r = row; r < row_max; r++) {
                for (let c = col; c < col_max; c++) {
                    mask.mask[r][c] = 1;
                }
            }
        }
    }
    return masks;
}
exports.squareMasks = squareMasks;
function hexMasks(m, size, width, height, xincr = 1) {
    let masks = Array(m);
    size = Math.floor(size);
    if (xincr < 0) {
        xincr = m + (xincr % m);
    }
    for (let i = 0; i < m; i++) {
        masks[i] = new mask_1.default(width, height, 0);
    }
    for (let j = 0; j < (height / size); j++) {
        for (let i = 0; i < (width / size); i++) {
            let col = i * size;
            let row = j * size;
            let selected = (i + (j * 2) % 8) % m;
            if (j % 2 == 1) { // brick effect
                col += size / 2;
            }
            let mask = masks[selected];
            let path = mask.getPath();
            let y = 3 * size / 16;
            // 6 pts to make an hexagon
            path.moveTo(col, row + y);
            path.lineTo(col + size / 2, row - y);
            path.lineTo(col + size, row + y);
            path.lineTo(col + size, row + size - y);
            path.lineTo(col + size / 2, row + size + y);
            path.lineTo(col, row + size - y);
            path.closePath();
        }
    }
    masks.forEach(mask => {
        if (mask.path === undefined)
            return;
        let ctx = mask.getCanvas().getContext("2d");
        ctx.fillStyle = "#111";
        mask.path.send(ctx);
        ctx.fill();
        mask.copyFrom(ctx);
    });
    return masks;
}
exports.hexMasks = hexMasks;
function triangleMasks(m, size, width, height) {
    //TODO (jdf) fix to work with any m or throw exception when m is odd??
    let masks = Array(m);
    size = Math.floor(size);
    for (let i = 0; i < m; i++) {
        masks[i] = new mask_1.default(width, height, 0);
    }
    for (let j = 0; j <= (height / size); j++) {
        for (let i = 0; i < (width / size); i++) {
            //let selected = (((i-j%2) +(width/size)- j))%m;
            let selected = i % (m / 2);
            if (j % 2 == 1)
                selected = i % (m / 2) + m / 2;
            let row = (j - 1) * size;
            let col = (i - 1) * size * 1.5 - (j % 2) * (size * 0.75);
            let mask = masks[selected];
            let path = mask.getPath();
            path.moveTo(col + 0.75 * 0 * size, col + 0.75 * 2 * size);
            path.lineTo(col + 0.75 * 1 * size, col + 0.75 * 3 * size);
            path.lineTo(col + 0.75 * 2 * size, col + 0.75 * 4 * size);
            path.closePath();
            path.moveTo(col + 0.75 * 2 * size, row + size);
            path.lineTo(col + 0.75 * 3 * size, row + 2 * size);
            path.lineTo(col + 0.75 * 4 * size, row + size);
            path.closePath();
        }
    }
    masks.forEach(mask => {
        if (mask.path === undefined)
            return;
        let ctx = mask.getCanvas().getContext("2d");
        ctx.fillStyle = "#111";
        mask.path.send(ctx);
        ctx.fill();
        mask.copyFrom(ctx);
    });
    return masks;
}
exports.triangleMasks = triangleMasks;
function randomMasks(m, size, width, height) {
    let masks = Array(m);
    size = Math.floor(size);
    for (let i = 0; i < m; i++) {
        masks[i] = new mask_1.default(width, height, 0);
    }
    for (let row = 0; row < height; row += size) {
        let row_max = Math.min(row + size, height);
        for (let col = 0; col < width; col += size) {
            let col_max = Math.min(col + size, width);
            let selected = Math.floor(Math.random() * m);
            let mask = masks[selected];
            for (let r = row; r < row_max; r++) {
                for (let c = col; c < col_max; c++) {
                    mask.mask[r][c] = 1;
                }
            }
        }
    }
    return masks;
}
exports.randomMasks = randomMasks;
//# sourceMappingURL=weaving.js.map
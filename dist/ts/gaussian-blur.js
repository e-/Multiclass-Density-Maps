"use strict";
// from http://blog.ivank.net/fastest-gaussian-blur.html
Object.defineProperty(exports, "__esModule", { value: true });
function boxesForGauss(sigma, n) {
    let wIdeal = Math.sqrt((12 * sigma * sigma / n) + 1); // Ideal averaging filter width
    var wl = Math.floor(wIdeal);
    if (wl % 2 == 0)
        wl--;
    let wu = wl + 2;
    let mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
    let m = Math.round(mIdeal);
    // var sigmaActual = Math.sqrt( (m*wl*wl + (n-m)*wu*wu - n)/12 );
    let sizes = [];
    for (var i = 0; i < n; i++)
        sizes.push(i < m ? wl : wu);
    return sizes;
}
function gaussian_blur(scl, tcl, w, h, r) {
    var bxs = boxesForGauss(r, 3);
    boxBlur_4(scl, tcl, w, h, (bxs[0] - 1) / 2);
    boxBlur_4(tcl, scl, w, h, (bxs[1] - 1) / 2);
    boxBlur_4(scl, tcl, w, h, (bxs[2] - 1) / 2);
}
exports.default = gaussian_blur;
function boxBlur_4(scl, tcl, w, h, r) {
    for (var i = 0; i < scl.length; i++)
        tcl[i] = scl[i];
    boxBlurH_4(tcl, scl, w, h, r);
    boxBlurT_4(scl, tcl, w, h, r);
}
function boxBlurH_4(scl, tcl, w, h, r) {
    var iarr = 1 / (r + r + 1);
    for (var i = 0; i < h; i++) {
        var ti = i * w, li = ti, ri = ti + r;
        let fv = scl[ti], lv = scl[ti + w - 1], val = (r + 1) * fv;
        for (var j = 0; j < r; j++)
            val += scl[ti + j];
        for (var j = 0; j <= r; j++) {
            val += scl[ri++] - fv;
            tcl[ti++] = Math.round(val * iarr);
        }
        for (var j = r + 1; j < w - r; j++) {
            val += scl[ri++] - scl[li++];
            tcl[ti++] = Math.round(val * iarr);
        }
        for (var j = w - r; j < w; j++) {
            val += lv - scl[li++];
            tcl[ti++] = Math.round(val * iarr);
        }
    }
}
function boxBlurT_4(scl, tcl, w, h, r) {
    var iarr = 1 / (r + r + 1);
    for (var i = 0; i < w; i++) {
        var ti = i, li = ti, ri = ti + r * w;
        let fv = scl[ti], lv = scl[ti + w * (h - 1)], val = (r + 1) * fv;
        for (var j = 0; j < r; j++)
            val += scl[ti + j * w];
        for (var j = 0; j <= r; j++) {
            val += scl[ri] - fv;
            tcl[ti] = Math.round(val * iarr);
            ri += w;
            ti += w;
        }
        for (var j = r + 1; j < h - r; j++) {
            val += scl[ri] - scl[li];
            tcl[ti] = Math.round(val * iarr);
            li += w;
            ri += w;
            ti += w;
        }
        for (var j = h - r; j < h; j++) {
            val += lv - scl[li];
            tcl[ti] = Math.round(val * iarr);
            li += w;
            ti += w;
        }
    }
}
//# sourceMappingURL=gaussian-blur.js.map
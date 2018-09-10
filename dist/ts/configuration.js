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
const data_buffer_1 = __importDefault(require("./data-buffer"));
const pngjs3_1 = require("pngjs3");
class GeoSpec {
    constructor(projection = "mercator", latitudes, longitudes, proj4) {
        this.projection = projection;
        this.latitudes = latitudes;
        this.longitudes = longitudes;
        this.proj4 = proj4;
    }
}
exports.GeoSpec = GeoSpec;
class DataSpec {
    constructor(spec) {
        this.spec = spec;
        if ("source" in this.spec)
            this.source = this.spec.source;
        this.parseProjection();
        this.encoding = this.spec.encoding;
        this.buffers = this.spec.buffers;
    }
    parseProjection() {
        if ("projection" in this.spec) {
            this.geo = new GeoSpec();
            let geo = this.geo;
            let projection = this.spec.projection;
            if (projection.type)
                geo.projection = projection.type;
            let encoding = this.spec.encoding;
            if (encoding.x.scale.domain)
                geo.latitudes = encoding.x.scale.domain;
            if (encoding.y.scale.domain)
                geo.longitudes = encoding.y.scale.domain;
        }
    }
    load(base, useCache = true) {
        let requests = [];
        this.buffers.forEach(buffer => {
            if (!buffer.data) {
                let url = base + buffer.url;
                let responseType = undefined;
                if (url.toLowerCase().endsWith(".png")) {
                    responseType = "arraybuffer";
                }
                let promise = util.get(url, useCache, responseType)
                    .then((data) => {
                    if (url.toLowerCase().endsWith(".json"))
                        buffer.data = JSON.parse(data);
                    else {
                        let pngBuffer = new Buffer(data);
                        let png = pngjs3_1.PNG.sync.read(pngBuffer, { skipRescale: true });
                        let prebinned = util.create2D(png.width, png.height, 0);
                        let depth = png.data.BYTES_PER_ELEMENT * 8;
                        let max = 1 << depth - 1;
                        for (let i = 0; i < png.height; i++) {
                            for (let j = 0; j < png.width; j++) {
                                prebinned[i][j] = png.data[(i * png.width + j) * 4] / max;
                            }
                        }
                        buffer.data = prebinned;
                    }
                    return buffer;
                })
                    .catch((reason => {
                    console.error(`cannot load a buffer from ${url}: ${reason}`);
                    return buffer;
                }));
                requests.push(promise);
            }
        });
        return Promise.all(requests);
    }
}
exports.DataSpec = DataSpec;
class ComposeSpec {
    constructor(options) {
        this.mix = "mean";
        // blend
        this.mixing = "additive";
        // weaving*
        this.shape = "random";
        this.size = 8;
        this.widthprop = "none";
        this.colprop = false;
        // time
        this.interval = 0.6;
        // invmin
        this.threshold = 1;
        // propline
        this.sort = true;
        if (options)
            Object.assign(this, options);
    }
}
exports.ComposeSpec = ComposeSpec;
class GlyphSpec {
    constructor(options) {
        this.width = 32;
        this.height = 32;
        this.factor = 8;
        if (options)
            Object.assign(this, options);
    }
}
exports.GlyphSpec = GlyphSpec;
class RebinSpec {
    constructor(options) {
        this.type = "none";
        this.aggregation = "max";
        if (options)
            Object.assign(this, options);
    }
}
exports.RebinSpec = RebinSpec;
class RescaleSpec {
    constructor(options) {
        this.type = "linear";
        this.levels = 4; // for equidepth
        if (options)
            Object.assign(this, options);
    }
}
exports.RescaleSpec = RescaleSpec;
class ContourSpec {
    constructor(options) {
        this.stroke = 0;
        this.lineWidth = 1;
        this.colprop = true;
        this.fill = 0; // percentile over which we fill
        this.blur = 2;
        if (options)
            Object.assign(this, options);
    }
}
exports.ContourSpec = ContourSpec;
class LegendSpec {
    constructor(options) {
        this.format = ".2s";
        this.fontSize = "11px";
        this.fontFamily = "sans-serif";
        this.titleHeight = 12;
        this.titleDy = ".6em";
        this.rowHeight = 10;
        this.horizontalGutter = 5;
        this.verticalGutter = 3;
        this.width = 110;
        this.padding = 10;
        this.mixMapSize = 50;
        this.tickFontSize = "10px";
        this.markers = 3;
        // multiplicative circles
        this.size = 150;
        this.height = 50;
        if (options)
            Object.assign(this, options);
    }
}
exports.LegendSpec = LegendSpec;
class StrokeSpec {
    constructor(options) {
        this.color = "rgba(0, 0, 0, .25)";
        this.lineWidth = 2;
        this.type = "topojson";
        this.feature = "state";
        if (options)
            Object.assign(this, options);
    }
}
exports.StrokeSpec = StrokeSpec;
class AxisSpec {
    constructor(options) {
        this.marginLeft = 50;
        this.marginBottom = 40;
        this.marginRight = 15;
        this.marginTop = 10;
        if (options)
            Object.assign(this, options);
    }
}
exports.AxisSpec = AxisSpec;
class Configuration {
    constructor(spec) {
        this.spec = spec;
        this.blur = 0;
        this.width = -1;
        this.height = -1;
        this.bufferNames = [];
        if (typeof this.spec === "string") {
            this.spec = JSON.parse(this.spec);
        }
        this.parseDescription();
        this.parseBackground();
        this.data = this.parseData();
        this.parseSmooth();
        this.parseDerivedBuffers();
        this.parseReencoding();
        this.parseRebin();
        this.parseCompose();
        this.parseRescale();
        this.parseContour();
        this.legend = this.parseLegend();
        this.parseStroke();
        this.parseAxis();
    }
    parseDescription() {
        if ("description" in this.spec)
            this.description = this.spec.description;
    }
    parseBackground() {
        if ("background" in this.spec)
            this.background = this.spec.background;
    }
    parseData() {
        return this.spec.data;
    }
    parseSmooth() {
        if ("smooth" in this.spec) {
            if (this.spec.smooth.radius)
                this.blur = this.spec.smooth.radius;
        }
    }
    parseContour() {
        if ("contour" in this.spec) {
            this.contour = new ContourSpec(this.spec.contour);
        }
    }
    parseDerivedBuffers() {
    }
    parseReencoding() {
        this.reencoding = this.spec.reencoding;
    }
    parseRebin() {
        if (this.spec.rebin)
            this.rebin = new RebinSpec(this.spec.rebin);
    }
    parseCompose() {
        if (this.spec.compose) {
            this.compose = new ComposeSpec(this.spec.compose);
            if (this.spec.compose.glyphSpec) {
                this.compose.glyphSpec = new GlyphSpec(this.spec.compose.glyphSpec);
            }
        }
    }
    parseRescale() {
        if (this.spec.rescale)
            this.rescale = new RescaleSpec(this.spec.rescale);
    }
    parseLegend() {
        if (this.spec.legend === false)
            return this.legend = false;
        return this.legend = new LegendSpec(this.spec.legend);
    }
    parseStroke() {
        if (this.spec.stroke)
            this.stroke = new StrokeSpec(this.spec.stroke);
        else
            this.stroke = undefined;
    }
    parseAxis() {
        if (this.spec.axis)
            this.axis = new AxisSpec(this.spec.axis);
    }
    validate() {
        if (!this.data)
            return false;
        let widths = new Map(), heights = new Map();
        let data = this.data.dataSpec;
        if (!data ||
            !data.encoding ||
            !data.encoding.x ||
            !data.encoding.y ||
            !data.buffers)
            return false;
        let x_enc = data.encoding.x, y_enc = data.encoding.y;
        if (x_enc) {
            if (x_enc.bin && "maxbins" in x_enc.bin && x_enc.bin.maxbins)
                widths.set("maxbins", x_enc.bin.maxbins);
            if (x_enc.scale && x_enc.scale.range &&
                x_enc.scale.range instanceof Array && x_enc.scale.range.length > 1)
                widths.set("range", x_enc.scale.range[1]);
        }
        if (y_enc) {
            if (y_enc.bin && "maxbins" in y_enc.bin && y_enc.bin.maxbins)
                heights.set("maxbins", y_enc.bin.maxbins);
            if (y_enc.scale && y_enc.scale.range &&
                y_enc.scale.range instanceof Array && y_enc.scale.range.length > 1)
                heights.set("range", y_enc.scale.range[1]);
        }
        let error = "";
        this.bufferNames = [];
        let labelScaleRange;
        if (this.reencoding
            && this.reencoding.label
            && this.reencoding.label.scale
            && this.reencoding.label.scale.range
            && this.reencoding.label.scale.range.length >= data.buffers.length)
            labelScaleRange = this.reencoding.label.scale.range;
        data.buffers.forEach((buffer, i) => {
            if (buffer.value)
                this.bufferNames.push(buffer.value);
            else if (labelScaleRange)
                this.bufferNames.push(labelScaleRange[i]);
            else
                this.bufferNames.push(i.toString());
            if (buffer.data instanceof Array) {
                heights.set(buffer.value, buffer.data.length);
                widths.set(buffer.value, buffer.data[0].length);
            }
            else {
                error = "invalid buffer " + buffer.value;
            }
        });
        widths.forEach((width, k) => {
            if (this.width == -1)
                this.width = width;
            else if (this.width != width) {
                console.log("Inconsistent widths for " + k + " :" + width + " instead of " + this.width);
                error = k;
            }
        });
        heights.forEach((height, k) => {
            if (this.height == -1)
                this.height = height;
            else if (this.height != height) {
                console.log("Inconsistent heights for " + k + " :" + height + " instead of " + this.height);
                error = k;
            }
        });
        if (this.compose != undefined && this.compose.order != undefined) {
            let order = this.compose.order;
            let valid = new Set();
            for (let i = 0; i < order.length; i++) {
                if (order[i] < 0 || order[i] >= data.buffers.length) {
                    error = "invalid buffer index " + order[i];
                    break;
                }
                else if (order[i] in valid) {
                    error = "duplicated buffer index " + order[i];
                }
                valid.add(order[i]);
            }
        }
        if (error != "")
            return false;
        return true;
    }
    loadTopojson(base, useCache = true) {
        if (this.rebin && this.rebin.url && !this.rebin.topojson) {
            let url = base + this.rebin.url;
            return util
                .get(url, useCache)
                .then(response => {
                this.rebin.topojson = JSON.parse(response);
                return this;
            })
                .catch((reason) => {
                console.error(`Cannot load topojson at ${url}: ${reason}`);
                return this;
            });
        }
        return Promise.resolve(this);
    }
    loadStroke(base, useCache = true) {
        if (this.stroke &&
            this.stroke.type === "topojson" && this.stroke.url) {
            let url = base + this.stroke.url;
            return util
                .get(url, useCache)
                .then(response => {
                this.stroke.topojson = JSON.parse(response);
                return this;
            })
                .catch((reason) => {
                console.error(`Cannot load topojson at ${url}: ${reason}`);
                return this;
            });
        }
        return Promise.resolve(this);
    }
    loadData(base, useCache = true) {
        if (!this.data.dataSpec && this.data.url) {
            let url = base + this.data.url;
            return util
                .get(url, useCache)
                .then(response => {
                let dataSpec = new DataSpec(JSON.parse(response));
                this.data.dataSpec = dataSpec;
                return this.data.dataSpec.load(base, useCache);
            })
                .catch((reason) => {
                console.error(`Cannot load dataSpec at ${url}: ${reason}`);
            });
        }
        return Promise.resolve(this);
    }
    // load data from the server if this.data contains url
    load(base, useCache = true) {
        if (!base.endsWith('/'))
            base += '/';
        return Promise.all([this.loadData(base, useCache),
            this.loadTopojson(base, useCache),
            this.loadStroke(base, useCache)]).then(() => this);
    }
    getBuffers() {
        let data = this.data;
        if (!data ||
            !data.dataSpec ||
            !data.dataSpec.buffers)
            return [];
        let dataBuffers = data.dataSpec.buffers.map((bufferSpec) => new data_buffer_1.default(bufferSpec.value, this.width, this.height, bufferSpec.data));
        return dataBuffers;
    }
    getColors0() {
        if (!this.reencoding
            || !this.reencoding.color
            || !this.reencoding.color.scale
            || !this.reencoding.color.scale.range0)
            return [];
        return this.reencoding.color.scale.range0;
    }
    getColors1() {
        if (!this.reencoding
            || !this.reencoding.color
            || !this.reencoding.color.scale
            || !this.reencoding.color.scale.range1)
            return [];
        return this.reencoding.color.scale.range1;
    }
    getGeo() {
        let geo = this.data.dataSpec.geo;
        if (this.spec.rebin &&
            this.spec.rebin.proj4)
            geo.proj4 = this.spec.rebin.proj4;
        return geo;
    }
    getXDomain() {
        let data = this.data.dataSpec;
        if (!data ||
            !data.encoding ||
            !data.encoding.x ||
            !data.encoding.x.scale ||
            !data.encoding.x.scale.domain)
            return [0, this.width];
        return data.encoding.x.scale.domain;
    }
    getYDomain() {
        let data = this.data.dataSpec;
        if (!data ||
            !data.encoding ||
            !data.encoding.y ||
            !data.encoding.y.scale ||
            !data.encoding.y.scale.domain)
            return [0, this.height];
        return data.encoding.y.scale.domain;
    }
}
exports.Configuration = Configuration;
//# sourceMappingURL=configuration.js.map
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
class SchemaSpec {
    constructor(spec) {
        this.spec = spec;
        if ("source" in this.spec)
            this.source = this.spec.source;
        this.parseProjection();
        this.encoding = this.spec.encoding;
        this.dataBuffers = this.spec.buffers;
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
    /**
     * load all binned pixels.
     * Before calling this function, a schema spec has only urls of data buffers.
     * Calling this function, binnedPixels of data buffers are filled.
     */
    load(base, useCache = true) {
        let requests = [];
        this.dataBuffers.forEach(buffer => {
            if (!buffer.binnedPixels) {
                let url = base + buffer.url;
                let responseType = undefined;
                if (url.toLowerCase().endsWith(".png")) {
                    responseType = "arraybuffer";
                }
                let promise = util.get(url, useCache, responseType)
                    .then((data) => {
                    if (url.toLowerCase().endsWith(".json"))
                        buffer.binnedPixels = JSON.parse(data);
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
                        // filling binnedPixels
                        buffer.binnedPixels = prebinned;
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
    loadJson(data) {
        let requests = [];
        this.dataBuffers.forEach(buffer => {
            if (!buffer.binnedPixels) {
                buffer.binnedPixels = data;
            }
        });
        return Promise.all(requests);
    }
}
exports.SchemaSpec = SchemaSpec;
class StyleScaleSpec {
    constructor(options) {
        this.type = "linear";
        this.levels = 4; // for equidepth
        if (options)
            Object.assign(this, options);
    }
}
exports.StyleScaleSpec = StyleScaleSpec;
class AssemblySpec {
    constructor(options) {
        this.type = "mean";
        // weaving*
        this.shape = "square";
        this.random = false;
        // weaving & dotdensity
        this.size = 8;
        // time
        this.duration = 0.6;
        // invmin
        this.threshold = 1;
        // propline & hatching
        this.sort = true;
        this.colprop = false;
        if (options) {
            Object.assign(this, options);
            if (options.glyphSpec) {
                this.glyphSpec = new GlyphSpec(options.glyphSpec);
            }
        }
    }
}
exports.AssemblySpec = AssemblySpec;
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
class ScaleSpec {
    constructor(options) {
        this.type = "linear";
        this.levels = 4; // for equidepth
        if (options)
            Object.assign(this, options);
    }
}
exports.ScaleSpec = ScaleSpec;
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
class Config {
    constructor(spec) {
        this.spec = spec;
        this.scale = new ScaleSpec();
        this.width = -1;
        this.height = -1;
        this.bufferNames = [];
        if (typeof this.spec === "string") {
            this.spec = JSON.parse(this.spec);
        }
        this.parseDescription();
        this.parseBackground();
        this.parsePreprocess();
        this.data = this.parseData();
        this.parseStyle();
        this.parseContour();
        this.parseReencoding();
        this.parseRebin();
        this.parseAssembly();
        this.parseRescale();
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
    parsePreprocess() {
        if ("pre" in this.spec)
            this.preprocess = this.spec.pre;
    }
    parseData() {
        return this.spec.data;
    }
    parseStyle() {
        if ("style" in this.spec) {
            this.style = this.spec.style;
        }
    }
    parseContour() {
        if ("contour" in this.spec) {
            this.contour = new ContourSpec(this.spec.contour);
        }
    }
    parseReencoding() {
        this.reencoding = this.spec.reencoding;
    }
    parseRebin() {
        if (this.spec.rebin)
            this.rebin = new RebinSpec(this.spec.rebin);
    }
    parseAssembly() {
        let spec = this.spec.assembly || this.spec.compose; // backward compatibility
        if (spec.mix && !spec.type)
            spec.type = spec.mix; // backward compatibility
        if (spec.mixing && !spec.blending)
            spec.blending = spec.mixing; // backward compatibility
        if (spec.type == "weavingrandom") { // backward compatibility
            spec.type = "weaving";
            spec.shape = "square";
            spec.random = true;
        }
        else if (spec.type == "weavingsquare") {
            spec.type = "weaving";
            spec.shape = "square";
        }
        else if (spec.type == "weavingtri") {
            spec.type = "weaving";
            spec.shape = "tri";
        }
        else if (spec.type == "weavinghex") {
            spec.type = "weaving";
            spec.shape = "hex";
        }
        else if (spec.type == "weaving" && spec.shape == "random") {
            spec.shape = "square";
            spec.random = true;
        }
        if (spec.type == "blend") {
            if (spec.blending == "multiplicative")
                spec.type = "multiply";
            else if (spec.blending == "additive")
                spec.type = "add";
        }
        this.assembly = new AssemblySpec(spec);
    }
    parseRescale() {
        if (this.spec.rescale)
            this.scale = new ScaleSpec(this.spec.rescale);
        else if (this.style && this.style.scale)
            this.scale = this.style.scale;
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
        let schema = this.data.schema;
        if (!schema ||
            !schema.encoding ||
            !schema.encoding.x ||
            !schema.encoding.y ||
            !schema.dataBuffers)
            return false;
        let x_enc = schema.encoding.x, y_enc = schema.encoding.y;
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
        let labelScaleRange;
        if (this.reencoding
            && this.reencoding.label
            && this.reencoding.label.scale
            && this.reencoding.label.scale.range
            && this.reencoding.label.scale.range.length >= schema.dataBuffers.length)
            labelScaleRange = this.reencoding.label.scale.range;
        schema.dataBuffers.forEach((buffer, i) => {
            if (buffer.binnedPixels instanceof Array) {
                heights.set(buffer.value, buffer.binnedPixels.length);
                widths.set(buffer.value, buffer.binnedPixels[0].length);
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
        if (this.assembly != undefined && this.assembly.order != undefined) {
            let order = this.assembly.order;
            let valid = new Set();
            for (let i = 0; i < order.length; i++) {
                if (order[i] < 0 || order[i] >= schema.dataBuffers.length) {
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
        if (!this.data.schema && this.data.url) {
            let url = base + this.data.url;
            return util
                .get(url, useCache)
                .then(response => {
                let dataSpec = new SchemaSpec(JSON.parse(response));
                this.data.schema = dataSpec;
                this.bufferNames = this.data.schema.dataBuffers.map(b => b.value);
                return this.data.schema.load(base, useCache);
            })
                .catch((reason) => {
                console.error(`Cannot load dataSpec at ${url}: ${reason}`);
            });
        }
        return Promise.resolve(this);
    }
    loadDataJson(data) {
        if (!this.data.schema) {
            return Promise.resolve(data)
                .then(response => {
                let dataSpec = new SchemaSpec(response);
                this.data.schema = dataSpec;
                this.bufferNames = this.data.schema.dataBuffers.map(b => b.value);
                return this.data.schema.loadJson(data);
            })
                .catch((reason) => {
                console.error(`Cannot load dataSpec : ${reason}`);
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
    loadJson(data) {
        return Promise.all([this.loadDataJson(data)]).then(() => this);
    }
    getDataBuffers() {
        let data = this.data;
        if (!data ||
            !data.schema ||
            !data.schema.dataBuffers)
            return [];
        let spec = data.schema;
        let dataBuffers = spec.dataBuffers.map((dataBuffer) => new data_buffer_1.default(dataBuffer.value, this.width, this.height, dataBuffer.binnedPixels));
        return dataBuffers;
    }
    getGeo() {
        let geo = this.data.schema.geo;
        if (this.spec.rebin &&
            this.spec.rebin.proj4)
            geo.proj4 = this.spec.rebin.proj4;
        return geo;
    }
    getXDomain() {
        let data = this.data.schema;
        if (!data ||
            !data.encoding ||
            !data.encoding.x ||
            !data.encoding.x.scale ||
            !data.encoding.x.scale.domain)
            return [0, this.width];
        return data.encoding.x.scale.domain;
    }
    getYDomain() {
        let data = this.data.schema;
        if (!data ||
            !data.encoding ||
            !data.encoding.y ||
            !data.encoding.y.scale ||
            !data.encoding.y.scale.domain)
            return [0, this.height];
        return data.encoding.y.scale.domain;
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map
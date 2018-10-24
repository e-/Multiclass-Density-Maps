import * as util from "./util";
import DataBuffer from "./data-buffer";
import { PNG } from "pngjs3";

export type NumPair = [number, number];

export interface SourceSpec {
    filename?: string;
    type?: string;
    rows?: number;
}

export interface XYEncodingScaleSpec {
    domain: NumPair;
    range: NumPair;
}

export interface XYEncodingSpec {
    field: string;
    type: string; // specify quantitative, latitude, longitude
    bin: { maxbins: number };
    aggregate: string; // count, maybe sum etc.
    scale: XYEncodingScaleSpec;
}

export interface BufferEncodingScaleSpec {
    domain: string[];
}

export interface BufferEncodingSpec {
    field: string;
    type: string; // specify nominal
    scale: BufferEncodingScaleSpec;
}

export interface EncodingSpec {
    x: XYEncodingSpec;
    y: XYEncodingSpec;
    z: BufferEncodingSpec;
}

export interface BufferSpec {
    value: string; // the class
    url?: string;
    data?: number[][];
    count?: number;
    range?: NumPair;
}

interface ProjectionSpec {
    type: string;
}

export class GeoSpec {
    constructor(public projection: string = "mercator",
        public latitudes?: NumPair,
        public longitudes?: NumPair,
        public proj4?: string) { }
}

export class DataSpec {
    public source?: SourceSpec;
    public geo?: GeoSpec;
    public encoding: EncodingSpec;
    public buffers: BufferSpec[];

    constructor(public spec: any) {
        if ("source" in this.spec)
            this.source = <SourceSpec>this.spec.source;

        this.parseProjection();

        this.encoding = <EncodingSpec>this.spec.encoding;
        this.buffers = <BufferSpec[]>this.spec.buffers;
    }

    parseProjection() {
        if ("projection" in this.spec) {
            this.geo = new GeoSpec();
            let geo = this.geo;

            let projection = <ProjectionSpec>this.spec.projection;
            if (projection.type)
                geo.projection = projection.type;
            let encoding = this.spec.encoding;

            if (encoding.x.scale.domain)
                geo.latitudes = encoding.x.scale.domain;
            if (encoding.y.scale.domain)
                geo.longitudes = encoding.y.scale.domain;
        }
    }

    load(base: string, useCache = true) {
        let requests: Promise<BufferSpec>[] = [];

        this.buffers.forEach(buffer => {
            if (!buffer.data) {
                let url = base + buffer.url!;
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
                            let png = PNG.sync.read(pngBuffer, { skipRescale: true });
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
                    }))

                requests.push(promise);
            }
        })

        return Promise.all(requests);
    }
}

export interface ConfigDataSpec {
    url?: string;
    order?: string[];
    rename?: ConfigDataRenameSpec[];
    dataSpec?: DataSpec;
}

export interface ConfigDataRenameSpec {
    from: string;
    to: string;
}

export interface ConfigReencodingLabelScaleSpec {
    domain: string[];
    range: string[];
}

export interface ConfigReencodingLabelSpec {
    field: string;
    type?: string; // specify nominal
    scale: ConfigReencodingLabelScaleSpec;
}

export interface ConfigReencodingColorScaleSpec {
    domain?: string[];
    range0: string[];
    range1: string[];
    type?: string;
}

export interface ConfigReencodingColorSpec {
    field: string;
    type?: string; // specify nominal
    scale: ConfigReencodingColorScaleSpec;
}

export interface ConfigReencodingHatchingSpec {
    domain?: string[];
    range: string[];
    type?: string;
}

export interface ConfigReencodingSpec {
    label?: ConfigReencodingLabelSpec;
    color?: ConfigReencodingColorSpec;
    hatching?: ConfigReencodingHatchingSpec;
}

export class ComposeSpec {
    mix: "none" | "invmin" | "mean" | "max" | "blend" |
        "weaving" | "propline" | "hatching" | "separate" | "glyph" | "dotdensity" | "time" = "mean";

    // blend
    mixing: "additive" | "multiplicative" = "additive";

    // weaving*
    shape: "random" | "square" | "hex" | "tri" = "random"

    // weaving & dotdensity
    size: number = 8;

    // time
    interval: number = 0.6;

    // invmin
    threshold: number = 1;

    // propline & hatching
    sort: boolean = true;
    colprop: boolean = false;
    widthprop?: 'percent' | number;
    order?: number[];

    // glyph
    glyphSpec?: GlyphSpec;

    constructor(options?: ComposeSpec) {
        if (options) Object.assign(this, options);
    }
}

export class GlyphSpec {
    template?: "bars" | "punchcard";
    width: number = 32;
    height: number = 32;
    factor: number = 8;

    constructor(options?: GlyphSpec) {
        if (options) Object.assign(this, options);
    }
}


export class RebinSpec {
    type: "none" | "square" | "rect" | "topojson" | "voronoi" = "none";
    width?: number;
    height?: number;
    size?: number;
    feature?: string;
    url?: string;
    topojson?: any;
    points?: NumPair[];
    stroke?: string; // color
    aggregation: "max" | "mean" | "sum" | "min" = "max";

    constructor(options?: RebinSpec) {
        if (options) Object.assign(this, options);
    }
}

export class RescaleSpec {
    type: "linear" | "log" | "sqrt" | "cbrt" | "equidepth" = "linear";
    levels: number = 4; // for equidepth

    constructor(options?: RescaleSpec) {
        if (options) Object.assign(this, options);
    }
}

export class ContourSpec {
    stroke: number = 0;
    lineWidth: number = 1;
    colprop: boolean = true;
    fill: number = 0; // percentile over which we fill
    blur: number = 2;

    constructor(options?: ContourSpec) {
        if (options) Object.assign(this, options);
    }
}

export class LegendSpec {
    format: string = ".2s";
    fontSize: string = "11px";
    fontFamily: string = "sans-serif";

    title?: string;
    titleHeight: number = 12;
    titleDy: string = ".6em";

    rowHeight: number = 10;
    horizontalGutter: number = 5;
    verticalGutter: number = 3;
    width: number = 110;
    padding: number = 10;
    mixMapSize: number = 50;

    tickFontSize: string = "10px";

    markers: number = 3;
    numTicks?: number;

    // multiplicative circles
    size: number = 150;

    height: number = 50;

    constructor(options?: LegendSpec) {
        if (options) Object.assign(this, options);
    }
}

export class StrokeSpec {
    color: string = "rgba(0, 0, 0, .25)";
    lineWidth: number = 2;
    type: "topojson" = "topojson";
    url?: string;
    topojson: any;
    feature: string = "state";

    constructor(options?: StrokeSpec) {
        if (options) Object.assign(this, options);
    }
}

export interface AxisEncodingSpec {
    title?: string;
}

export class AxisSpec {
    marginLeft: number = 50;
    marginBottom: number = 40;
    marginRight: number = 15;
    marginTop: number = 10;
    x?: AxisEncodingSpec;
    y?: AxisEncodingSpec;

    constructor(options?: AxisSpec) {
        if (options) Object.assign(this, options);
    }
}

export class Config {
    description?: string;
    background?: string;
    data: ConfigDataSpec;
    blur: number = 0;
    reencoding?: ConfigReencodingSpec;
    rebin?: RebinSpec;
    compose?: ComposeSpec;
    rescale?: RescaleSpec;
    contour?: ContourSpec;
    width: number = -1;
    height: number = -1;
    bufferNames: string[] = [];
    legend: LegendSpec | false;
    stroke?: StrokeSpec
    axis?: AxisSpec;

    constructor(public spec: any) {
        if (typeof this.spec === "string") {
            this.spec = JSON.parse(this.spec as string);
        }

        this.parseDescription();
        this.parseBackground();
        this.data = this.parseData();

        this.parseSmooth();
        this.parseReencoding();
        this.parseRebin();
        this.parseCompose();
        this.parseRescale();
        this.parseContour();
        this.legend = this.parseLegend();
        this.parseStroke();
        this.parseAxis();
    }

    private parseDescription() {
        if ("description" in this.spec)
            this.description = this.spec.description;
    }
    private parseBackground() {
        if ("background" in this.spec)
            this.background = this.spec.background;
    }
    private parseData() {
        return <ConfigDataSpec>this.spec.data;
    }
    private parseSmooth() {
        if ("smooth" in this.spec) {
            if (this.spec.smooth.radius)
                this.blur = <number>this.spec.smooth.radius;
        }
    }
    private parseContour() {
        if ("contour" in this.spec) {
            this.contour = new ContourSpec(this.spec.contour);
        }
    }
    private parseReencoding() {
        this.reencoding = <ConfigReencodingSpec>this.spec.reencoding;
    }
    private parseRebin() {
        if (this.spec.rebin)
            this.rebin = new RebinSpec(this.spec.rebin);
    }
    private parseCompose() {
        if (this.spec.compose) {
            this.compose = new ComposeSpec(this.spec.compose)
            if (this.spec.compose.glyphSpec) {
                this.compose.glyphSpec = new GlyphSpec(this.spec.compose.glyphSpec);
            }
        }
    }
    private parseRescale() {
        if (this.spec.rescale)
            this.rescale = new RescaleSpec(this.spec.rescale);
    }
    private parseLegend() {
        if (this.spec.legend === false)
            return this.legend = false;
        return this.legend = new LegendSpec(this.spec.legend);
    }
    private parseStroke() {
        if (this.spec.stroke)
            this.stroke = new StrokeSpec(this.spec.stroke);
        else
            this.stroke = undefined;
    }
    private parseAxis() {
        if (this.spec.axis)
            this.axis = new AxisSpec(this.spec.axis);
    }

    public validate(): boolean {
        if (!this.data)
            return false;
        let widths = new Map<string, number>(), heights = new Map<string, number>();
        let data = this.data.dataSpec;
        if (!data ||
            !data.encoding ||
            !data.encoding.x ||
            !data.encoding.y ||
            !data.buffers)
            return false;
        let x_enc = data.encoding.x,
            y_enc = data.encoding.y;
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
        let labelScaleRange: string[];
        if (this.reencoding
            && this.reencoding.label
            && this.reencoding.label.scale
            && this.reencoding.label.scale.range
            && this.reencoding.label.scale.range.length >= data.buffers.length)
            labelScaleRange = this.reencoding.label.scale.range;

        data.buffers.forEach((buffer, i) => {
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
            let valid = new Set<number>();
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

    private loadTopojson(base: string, useCache = true): Promise<Config> {
        if (this.rebin && this.rebin.url && !this.rebin.topojson) {
            let url = base + this.rebin.url;
            return util
                .get(url, useCache)
                .then(response => {
                    this.rebin!.topojson = JSON.parse(response);
                    return this;
                })
                .catch((reason) => {
                    console.error(`Cannot load topojson at ${url}: ${reason}`);
                    return this;
                });
        }

        return Promise.resolve(this);
    }

    private loadStroke(base: string, useCache = true): Promise<Config> {
        if (this.stroke &&
            this.stroke.type === "topojson" && this.stroke.url) {
            let url = base + this.stroke.url;
            return util
                .get(url, useCache)
                .then(response => {
                    this.stroke!.topojson = JSON.parse(response);
                    return this;
                })
                .catch((reason) => {
                    console.error(`Cannot load topojson at ${url}: ${reason}`);
                    return this;
                });
        }
        return Promise.resolve(this);
    }

    private loadData(base: string, useCache = true): Promise<any> {
        if (!this.data.dataSpec && this.data.url) {
            let url = base + this.data.url!;
            return util
                .get(url, useCache)
                .then(response => {
                    let dataSpec = new DataSpec(JSON.parse(response));
                    this.data.dataSpec = dataSpec;

                    if(this.data.order) {
                        if(this.data.order.length != this.data.dataSpec!.buffers.length)
                            throw new Error(`the length of the order array does not match ${this.data.order.length} != ${this.data.dataSpec!.buffers.length}`)

                        let reordered = this.data.order.map(name =>
                            this.data.dataSpec!.buffers.filter(bf => bf.value == name)[0]
                        )

                        this.data.dataSpec!.buffers = reordered;
                    }

                    if(this.data.rename) {
                        let map:{[key:string]: string} = {};
                        this.data.rename.forEach(r => { map[r.from] = r.to; })
                        this.data.dataSpec.buffers.forEach(buffer => {
                            buffer.value = map[buffer.value] || buffer.value;
                        })
                    }
                    this.bufferNames = this.data.dataSpec!.buffers.map(b => b.value);

                    return this.data.dataSpec!.load(base, useCache);
                })
                .catch((reason) => {
                    console.error(`Cannot load dataSpec at ${url}: ${reason}`);
                })
        }

        return Promise.resolve(this);
    }

    // load data from the server if this.data contains url
    load(base: string, useCache = true): Promise<Config> {
        if (!base.endsWith('/')) base += '/';
        return Promise.all([this.loadData(base, useCache),
        this.loadTopojson(base, useCache),
        this.loadStroke(base, useCache)]).then(() => this);
    }

    public getBuffers(): DataBuffer[] {
        let data = this.data;
        if (!data ||
            !data.dataSpec ||
            !data.dataSpec.buffers)
            return [];

        let spec = data.dataSpec;
        let dataBuffers = spec.buffers.map((bufferSpec) =>
            new DataBuffer(bufferSpec.value,
                this.width,
                this.height,
                bufferSpec.data));

        return dataBuffers;
    }

    public getColors0(): string[] {
        if (!this.reencoding
            || !this.reencoding.color
            || !this.reencoding.color.scale
            || !this.reencoding.color.scale.range0)
            return [];
        return this.reencoding.color.scale.range0;
    }

    public getColors1(): string[] {
        if (!this.reencoding
            || !this.reencoding.color
            || !this.reencoding.color.scale
            || !this.reencoding.color.scale.range1)
            return [];
        return this.reencoding.color.scale.range1;
    }

    public getGeo(): GeoSpec {
        let geo = this.data!.dataSpec!.geo!;

        if (this.spec.rebin &&
            this.spec.rebin.proj4)
            geo.proj4 = this.spec.rebin.proj4;

        return geo;
    }

    public getXDomain(): NumPair {
        let data = this.data!.dataSpec!;
        if (!data ||
            !data.encoding ||
            !data.encoding.x ||
            !data.encoding.x.scale ||
            !data.encoding.x.scale.domain)
            return [0, this.width];
        return data.encoding.x.scale.domain;
    }

    public getYDomain(): NumPair {
        let data = this.data!.dataSpec!;
        if (!data ||
            !data.encoding ||
            !data.encoding.y ||
            !data.encoding.y.scale ||
            !data.encoding.y.scale.domain)
            return [0, this.height];
        return data.encoding.y.scale.domain;
    }


}


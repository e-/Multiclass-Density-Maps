import * as util from "./util";
import DataBuffer from "./data-buffer";
import { PNG } from "pngjs3";

export type NumPair = [number, number];

/*
Specification
{
    "data": {
        "url": "census.snappy_data.json"
    },
    "pre": {
        "gaussian": 4
    },
    "style": {
        "classes": [
            {
                "name": "w",
                "alias": "White",
                "color0": "White",
                "color1": "Blue"
            },
            {
                "name": "h",
                "alias": "Hispanic",
                "color0": "White",
                "color1": "Orange"
            },
            {
                "name": "a",
                "alias": "Asian",
                "color0": "White",
                "color1": "Red"
            },
            {
                "name": "b",
                "alias": "Black",
                "color0": "White",
                "color1": "Green"
            },
            {
                "name": "o",
                "alias": "Other",
                "color0": "White",
                "color1": "Brown"
            },
        ],
        "scale": {
            "type": "log"
        }
    },
    "rebin": {
        "type": "topojson",
        "url": "us.json",
        "feature": "states",
        "stroke": "grey"
    },
    "compose | assembly": {
        "type": "mean",
    },
    "contour": {

    }
}

*/

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

export interface DataBufferSpec {
    value: string; // the class
    url?: string;
    binnedPixels?: number[][];
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

export class SchemaSpec {
    public source?: SourceSpec;
    public geo?: GeoSpec;
    public encoding: EncodingSpec;
    public dataBuffers: DataBufferSpec[];

    constructor(public spec: any) {
        if ("source" in this.spec)
            this.source = <SourceSpec>this.spec.source;

        this.parseProjection();

        this.encoding = <EncodingSpec>this.spec.encoding;
        this.dataBuffers = <DataBufferSpec[]>this.spec.buffers;
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

    /**
     * load all binned pixels.
     * Before calling this function, a schema spec has only urls of data buffers.
     * Calling this function, binnedPixels of data buffers are filled.
     */
    load(base: string, useCache = true) {
        let requests: Promise<DataBufferSpec>[] = [];

        this.dataBuffers.forEach(buffer => {
            if (!buffer.binnedPixels) {
                let url = base + buffer.url!;
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
                            let png = PNG.sync.read(pngBuffer, { skipRescale: true });
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
                    }))

                requests.push(promise);
            }
        })

        return Promise.all(requests);
    }
}

export interface DataSpec {
    url?: string;
    schema?: SchemaSpec;
}

export interface PreprocessSpec {
    gaussian?: number;
}

export interface StyleSpec {
    classes?: StyleClassSpec[];
    scale?: StyleScaleSpec;
}

export interface StyleClassSpec {
    name: string;
    alias?: string;
    color0?: string;
    color1?: string;
}

export class StyleScaleSpec {
    type: "linear" | "log" | "sqrt" | "cbrt" | "equidepth" = "linear";
    levels: number = 4; // for equidepth

    constructor(options?: ScaleSpec) {
        if (options) Object.assign(this, options);
    }
}

export interface ReencodingLabelScaleSpec {
    domain: string[];
    range: string[];
}

export interface ReencodingLabelSpec {
    field: string;
    type?: string; // specify nominal
    scale: ReencodingLabelScaleSpec;
}

export interface ReencodingColorScaleSpec {
    domain?: string[];
    range0: string[];
    range1: string[];
    type?: string;
}

export interface ReencodingColorSpec {
    field: string;
    type?: string; // specify nominal
    scale: ReencodingColorScaleSpec;
}

export interface ReencodingSpec {
    label?: ReencodingLabelSpec;
    color?: ReencodingColorSpec;
}

export class AssemblySpec {
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

    constructor(options?: AssemblySpec) {
        if (options) {
            Object.assign(this, options);
            if (options.glyphSpec) {
                this.glyphSpec = new GlyphSpec(options.glyphSpec);
            }
        }
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

export class ScaleSpec {
    type: "linear" | "log" | "sqrt" | "cbrt" | "equidepth" = "linear";
    levels: number = 4; // for equidepth

    constructor(options?: ScaleSpec) {
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
    data: DataSpec;
    preprocess?: PreprocessSpec;
    style?: StyleSpec;
    reencoding?: ReencodingSpec;
    rebin?: RebinSpec;
    assembly?: AssemblySpec;
    scale: ScaleSpec = new ScaleSpec();
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

    private parseDescription() {
        if ("description" in this.spec)
            this.description = this.spec.description;
    }
    private parseBackground() {
        if ("background" in this.spec)
            this.background = this.spec.background;
    }
    private parsePreprocess() {
        if("pre" in this.spec)
            this.preprocess = <PreprocessSpec>this.spec.pre;
    }
    private parseData() {
        return <DataSpec>this.spec.data;
    }
    private parseStyle() {
        if ("style" in this.spec) {
            this.style = <StyleSpec>this.spec.style;
        }
    }
    private parseContour() {
        if ("contour" in this.spec) {
            this.contour = new ContourSpec(this.spec.contour);
        }
    }
    private parseReencoding() {
        this.reencoding = <ReencodingSpec>this.spec.reencoding;
    }
    private parseRebin() {
        if (this.spec.rebin)
            this.rebin = new RebinSpec(this.spec.rebin);
    }
    private parseAssembly() {
        let spec = this.spec.assembly || this.spec.compose;
        this.assembly = new AssemblySpec(spec);
    }
    private parseRescale() {
        if (this.spec.rescale)
            this.scale = new ScaleSpec(this.spec.rescale);
        else if(this.style && this.style.scale)
            this.scale = this.style.scale;
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
        let schema = this.data.schema;
        if (!schema ||
            !schema.encoding ||
            !schema.encoding.x ||
            !schema.encoding.y ||
            !schema.dataBuffers)
            return false;
        let x_enc = schema.encoding.x,
            y_enc = schema.encoding.y;
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
            let valid = new Set<number>();
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
        if (!this.data.schema && this.data.url) {
            let url = base + this.data.url!;
            return util
                .get(url, useCache)
                .then(response => {
                    let dataSpec = new SchemaSpec(JSON.parse(response));
                    this.data.schema = dataSpec;

                    this.bufferNames = this.data.schema!.dataBuffers.map(b => b.value);

                    return this.data.schema!.load(base, useCache);
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

    public getDataBuffers(): DataBuffer[] {
        let data = this.data;
        if (!data ||
            !data.schema ||
            !data.schema.dataBuffers)
            return [];

        let spec = data.schema;
        let dataBuffers = spec.dataBuffers.map((dataBuffer) =>
            new DataBuffer(dataBuffer.value,
                this.width,
                this.height,
                dataBuffer.binnedPixels));

        return dataBuffers;
    }

    public getGeo(): GeoSpec {
        let geo = this.data!.schema!.geo!;

        if (this.spec.rebin &&
            this.spec.rebin.proj4)
            geo.proj4 = this.spec.rebin.proj4;

        return geo;
    }

    public getXDomain(): NumPair {
        let data = this.data!.schema!;
        if (!data ||
            !data.encoding ||
            !data.encoding.x ||
            !data.encoding.x.scale ||
            !data.encoding.x.scale.domain)
            return [0, this.width];
        return data.encoding.x.scale.domain;
    }

    public getYDomain(): NumPair {
        let data = this.data!.schema!;
        if (!data ||
            !data.encoding ||
            !data.encoding.y ||
            !data.encoding.y.scale ||
            !data.encoding.y.scale.domain)
            return [0, this.height];
        return data.encoding.y.scale.domain;
    }


}


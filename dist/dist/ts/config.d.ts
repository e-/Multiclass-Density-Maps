import DataBuffer from "./data-buffer";
export declare type NumPair = [number, number];
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
    type: string;
    bin: {
        maxbins: number;
    };
    aggregate: string;
    scale: XYEncodingScaleSpec;
}
export interface BufferEncodingScaleSpec {
    domain: string[];
}
export interface BufferEncodingSpec {
    field: string;
    type: string;
    scale: BufferEncodingScaleSpec;
}
export interface EncodingSpec {
    x: XYEncodingSpec;
    y: XYEncodingSpec;
    z: BufferEncodingSpec;
}
export interface BufferSpec {
    value: string;
    url?: string;
    data?: number[][];
    count?: number;
    range?: NumPair;
}
export declare class GeoSpec {
    projection: string;
    latitudes: [number, number] | undefined;
    longitudes: [number, number] | undefined;
    proj4: string | undefined;
    constructor(projection?: string, latitudes?: [number, number] | undefined, longitudes?: [number, number] | undefined, proj4?: string | undefined);
}
export declare class DataSpec {
    spec: any;
    source?: SourceSpec;
    geo?: GeoSpec;
    encoding: EncodingSpec;
    buffers: BufferSpec[];
    constructor(spec: any);
    parseProjection(): void;
    load(base: string, useCache?: boolean): Promise<BufferSpec[]>;
}
export interface ConfigDataSpec {
    url?: string;
    reorder?: string[];
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
    type?: string;
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
    type?: string;
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
export declare class ComposeSpec {
    mix: "none" | "invmin" | "mean" | "max" | "blend" | "weaving" | "propline" | "hatching" | "separate" | "glyph" | "dotdensity" | "time";
    mixing: "additive" | "multiplicative";
    shape: "random" | "square" | "hex" | "tri";
    size: number;
    interval: number;
    threshold: number;
    sort: boolean;
    colprop: boolean;
    widthprop?: 'percent' | number;
    order?: number[];
    glyphSpec?: GlyphSpec;
    constructor(options?: ComposeSpec);
}
export declare class GlyphSpec {
    template?: "bars" | "punchcard";
    width: number;
    height: number;
    factor: number;
    constructor(options?: GlyphSpec);
}
export declare class RebinSpec {
    type: "none" | "square" | "rect" | "topojson" | "voronoi";
    width?: number;
    height?: number;
    size?: number;
    feature?: string;
    url?: string;
    topojson?: any;
    points?: NumPair[];
    stroke?: string;
    aggregation: "max" | "mean" | "sum" | "min";
    constructor(options?: RebinSpec);
}
export declare class RescaleSpec {
    type: "linear" | "log" | "sqrt" | "cbrt" | "equidepth";
    levels: number;
    constructor(options?: RescaleSpec);
}
export declare class ContourSpec {
    stroke: number;
    lineWidth: number;
    colprop: boolean;
    fill: number;
    blur: number;
    constructor(options?: ContourSpec);
}
export declare class LegendSpec {
    format: string;
    fontSize: string;
    fontFamily: string;
    title?: string;
    titleHeight: number;
    titleDy: string;
    rowHeight: number;
    horizontalGutter: number;
    verticalGutter: number;
    width: number;
    padding: number;
    mixMapSize: number;
    tickFontSize: string;
    markers: number;
    numTicks?: number;
    size: number;
    height: number;
    constructor(options?: LegendSpec);
}
export declare class StrokeSpec {
    color: string;
    lineWidth: number;
    type: "topojson";
    url?: string;
    topojson: any;
    feature: string;
    constructor(options?: StrokeSpec);
}
export interface AxisEncodingSpec {
    title?: string;
}
export declare class AxisSpec {
    marginLeft: number;
    marginBottom: number;
    marginRight: number;
    marginTop: number;
    x?: AxisEncodingSpec;
    y?: AxisEncodingSpec;
    constructor(options?: AxisSpec);
}
export declare class Config {
    spec: any;
    description?: string;
    background?: string;
    data: ConfigDataSpec;
    blur: number;
    reencoding?: ConfigReencodingSpec;
    rebin?: RebinSpec;
    compose?: ComposeSpec;
    rescale?: RescaleSpec;
    contour?: ContourSpec;
    width: number;
    height: number;
    bufferNames: string[];
    legend: LegendSpec | false;
    stroke?: StrokeSpec;
    axis?: AxisSpec;
    constructor(spec: any);
    private parseDescription();
    private parseBackground();
    private parseData();
    private parseSmooth();
    private parseContour();
    private parseReencoding();
    private parseRebin();
    private parseCompose();
    private parseRescale();
    private parseLegend();
    private parseStroke();
    private parseAxis();
    validate(): boolean;
    private loadTopojson(base, useCache?);
    private loadStroke(base, useCache?);
    private loadData(base, useCache?);
    load(base: string, useCache?: boolean): Promise<Config>;
    getBuffers(): DataBuffer[];
    getColors0(): string[];
    getColors1(): string[];
    getGeo(): GeoSpec;
    getXDomain(): NumPair;
    getYDomain(): NumPair;
}

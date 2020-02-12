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
export interface DataBufferSpec {
    value: string;
    url?: string;
    binnedPixels?: number[][];
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
export declare class SchemaSpec {
    spec: any;
    source?: SourceSpec;
    geo?: GeoSpec;
    encoding: EncodingSpec;
    dataBuffers: DataBufferSpec[];
    constructor(spec: any);
    parseProjection(): void;
    /**
     * load all binned pixels.
     * Before calling this function, a schema spec has only urls of data buffers.
     * Calling this function, binnedPixels of data buffers are filled.
     */
    load(base: string, useCache?: boolean): Promise<DataBufferSpec[]>;
    loadJson(data: any): Promise<DataBufferSpec[]>;
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
export declare class StyleScaleSpec {
    type: "linear" | "log" | "sqrt" | "cbrt" | "equidepth";
    levels: number;
    constructor(options?: ScaleSpec);
}
export interface ReencodingLabelScaleSpec {
    domain: string[];
    range: string[];
}
export interface ReencodingLabelSpec {
    field: string;
    type?: string;
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
    type?: string;
    scale: ReencodingColorScaleSpec;
}
export interface ReencodingSpec {
    label?: ReencodingLabelSpec;
    color?: ReencodingColorSpec;
}
export declare class AssemblySpec {
    type: "none" | "invmin" | "mean" | "max" | "add" | "multiply" | "weaving" | "propline" | "hatching" | "separate" | "glyph" | "dotdensity" | "time";
    shape: "square" | "hex" | "tri";
    random: boolean;
    size: number;
    duration: number;
    threshold: number;
    sort: boolean;
    colprop: boolean;
    widthprop?: 'percent' | number;
    order?: number[];
    glyphSpec?: GlyphSpec;
    constructor(options?: AssemblySpec);
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
export declare class ScaleSpec {
    type: "linear" | "log" | "sqrt" | "cbrt" | "equidepth";
    levels: number;
    constructor(options?: ScaleSpec);
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
    data: DataSpec;
    preprocess?: PreprocessSpec;
    style?: StyleSpec;
    reencoding?: ReencodingSpec;
    rebin?: RebinSpec;
    assembly?: AssemblySpec;
    scale: ScaleSpec;
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
    private parsePreprocess();
    private parseData();
    private parseStyle();
    private parseContour();
    private parseReencoding();
    private parseRebin();
    private parseAssembly();
    private parseRescale();
    private parseLegend();
    private parseStroke();
    private parseAxis();
    validate(): boolean;
    private loadTopojson(base, useCache?);
    private loadStroke(base, useCache?);
    private loadData(base, useCache?);
    private loadDataJson(data);
    load(base: string, useCache?: boolean): Promise<Config>;
    loadJson(data: any): Promise<Config>;
    getDataBuffers(): DataBuffer[];
    getGeo(): GeoSpec;
    getXDomain(): NumPair;
    getYDomain(): NumPair;
}

import DataBuffer from './data-buffer';
export interface SourceSpec {
    filename?: string;
    type?: string;
    rows?: number;
}
export interface XYEncodingScaleSpec {
    domain: [number, number];
    range: [number, number];
}
export interface XYEncodingSpec {
    field: string;
    type?: string;
    bin?: {
        maxbins?: number;
    };
    aggregate?: string;
    scale: XYEncodingScaleSpec;
}
export interface BufferEncodingScaleSpec {
    domain: string[];
}
export interface BufferEncodingSpec {
    field: string;
    type?: string;
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
    range?: [number, number];
}
export declare class GeoSpec {
    projection: string;
    latitudes: [number, number] | undefined;
    longitudes: [number, number] | undefined;
    proj4: string | undefined;
    constructor(projection?: string, latitudes?: [number, number] | undefined, longitudes?: [number, number] | undefined, proj4?: string | undefined);
}
export declare class DataSpec {
    specs: any;
    source?: SourceSpec;
    geo: GeoSpec;
    encoding?: EncodingSpec;
    buffers?: BufferSpec[];
    constructor(specs: any);
    parseSource(): void;
    parseProjection(): void;
    parseEncoding(): void;
    parseBuffers(): void;
    load(base?: string): Promise<void[]>;
}
export interface ConfigurationDataSpec {
    url?: string;
    type?: string;
    dataSpec?: DataSpec;
}
export interface ConfigurationReencodingLabelScaleSpec {
    domain: string[];
    range: string[];
}
export interface ConfigurationReencodingLabelSpec {
    field: string;
    type?: string;
    scale: ConfigurationReencodingLabelScaleSpec;
}
export interface ConfigurationReencodingColorScaleSpec {
    domain?: string[];
    range: string[];
    type?: string;
}
export interface ConfigurationReencodingColorSpec {
    field: string;
    type?: string;
    scale: ConfigurationReencodingColorScaleSpec;
}
export interface ConfigurationReencodingHatchingSpec {
    domain?: string[];
    range: string[];
    type?: string;
}
export interface ConfigurationReencodingSpec {
    label?: ConfigurationReencodingLabelSpec;
    color?: ConfigurationReencodingColorSpec;
    hatching?: ConfigurationReencodingHatchingSpec;
}
export declare class ComposeSpec {
    mix: "none" | "min" | "mean" | "max" | "blend" | "weavingrandom" | "weavingsquare" | "weavinghex" | "weavingtri" | "propline" | "hatching" | "separate" | "glyph" | "dotdensity";
    mixing: "additive" | "subtractive" | "multicative";
    size: number;
    widthprop: string | number;
    colprop: boolean;
    select?: number;
    url?: string;
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
    points?: [number, number][];
    stroke?: string;
    constructor(options?: RebinSpec);
}
export declare class RescaleSpec {
    type: "linear" | "log" | "pow" | "sqrt" | "cbrt" | "equidepth";
    level: number;
    constructor(options?: RescaleSpec);
}
export declare class ContourSpec {
    stroke: number;
    lineWidth: number;
    colProp: boolean;
    fill: number;
    values?: number[];
    blur: number;
    constructor(options?: ContourSpec);
}
export declare class LegendSpec {
    format: string;
    fontSize: string;
    fontFamily: string;
    rowHeight: number;
    gutter: number;
    labelWidth: number;
    colorMapWidth: number;
    padding: number;
    tickFontSize: string;
    markers: number;
    numTicks?: number;
    size: number;
    width: number;
    height: number;
    constructor(options?: LegendSpec);
}
export declare class Configuration {
    specs: any;
    description?: string;
    background?: string;
    data?: ConfigurationDataSpec;
    blur: number;
    reencoding?: ConfigurationReencodingSpec;
    rebin?: RebinSpec;
    compose?: ComposeSpec;
    rescale?: RescaleSpec;
    contour?: ContourSpec;
    width: number;
    height: number;
    bufferNames: string[];
    legend: LegendSpec | false;
    constructor(specs: any);
    private parseDescription();
    private parseBackground();
    private parseData();
    private parseSmooth();
    private parseContour();
    private parseDerivedBuffers();
    private parseReencoding();
    private parseRebin();
    private parseCompose();
    private parseRescale();
    validate(): boolean;
    loadTopojson(base?: string): Promise<Configuration>;
    load(base?: string): Promise<Configuration>;
    getBuffers(): DataBuffer[];
    getLabels(): string[] | undefined;
    getColors(): string[];
    getGeo(): GeoSpec;
    private parseLegend();
}

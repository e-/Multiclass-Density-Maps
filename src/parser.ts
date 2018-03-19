import * as util from './util';
import * as d3 from 'd3';
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
    type?: string; // specify quantitative, latitude, longitude
    bin?: {maxbins?: number};
    aggregate?: string; // count, maybe sum etc.
    scale: XYEncodingScaleSpec;
}

export interface BufferEncodingScaleSpec {
    domain: string[];
}

export interface BufferEncodingSpec {
    field: string;
    type?: string; // specify nominal
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
    range?: [number, number]
}

interface ProjectionSpec {
    type: string;
}

export class GeoSpec {
    constructor(public projection:string="mercator",
                public latitudes?:[number,number],
                public longitudes?:[number,number],
                public proj4?:string) { }
}

export class DataSpec {
    public source?: SourceSpec;
    public geo = new GeoSpec();
    public encoding?: EncodingSpec;
    public buffers?: BufferSpec[];

    constructor(public specs:any) {
        this.parseSource();
        this.parseEncoding();
        this.parseProjection();
        this.parseBuffers();
    }

    parseSource() {
        if ('source' in this.specs)
            this.source = <SourceSpec>this.specs.source;
    }
    parseProjection() {
        let geo = this.geo;
        if ('projection' in this.specs) {
            let projection = <ProjectionSpec>this.specs.projection;
            if (projection.type)
                geo.projection = projection.type;
            let encoding = this.encoding!;
            if (encoding.x != undefined&&
                encoding.x.scale  != undefined &&
                encoding.x.scale.domain != undefined)
                geo.latitudes = encoding.x.scale.domain;
            if (encoding.y != undefined &&
                encoding.y.scale  != undefined &&
                encoding.y.scale.domain != undefined)
                geo.longitudes = encoding.y.scale.domain;
        }
    }
    parseEncoding() {
        this.encoding = <EncodingSpec>this.specs.encoding;
    }
    parseBuffers() {
        this.buffers = <BufferSpec[]>this.specs.buffers;
    }

    load(base:string = '') {
        let requests:Promise<void>[] = [];

        this.buffers!.forEach((buffer) => {
            if(!buffer.data) {
                let promise = util.get(base + buffer.url!).then((data) => {
                    //console.log('Loaded '+buffer.url);
                    buffer.data = JSON.parse(data);
                })

                requests.push(promise);
            }
        })

        return Promise.all(requests);
    }
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
    type?: string; // specify nominal
    scale: ConfigurationReencodingLabelScaleSpec;
}

export interface ConfigurationReencodingColorScaleSpec {
    domain?: string[];
    range: string[];
    type?: string;
}

export interface ConfigurationReencodingColorSpec {
    field: string;
    type?: string; // specify nominal
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

export class ComposeSpec {
    mix: "none"|"min"|"mean"|"max"|"blend"|
          "weavingrandom"|"weavingsquare"|"weavinghex"|"weavingtri"|
          "hatching"|"separate"|"glyph"="mean";
    mixing: "additive"|"subtractive"|"multicative" = "additive";
    size:number = 8;
    proportional:boolean = true;
    select?:number;
    url?:string;
    glyphSpec?: GlyphSpec;

    constructor(options?: ComposeSpec) {
        if(options) Object.assign(this, options);
    }
}

export class GlyphSpec {
    template?: "bars"|"punchcard4";
    width:number = 32;
    height:number = 32;

    constructor(options?: GlyphSpec) {
        if(options) Object.assign(this, options);
    }
}


export class RebinSpec {
    type: "none"|"square"|"rect"|"topojson"|"voronoi" = "none";
    width?: number;
    height?: number;
    size?: number;
    feature?: string;
    url?: string;
    topojson?: any;
    points?: [number, number][];
    stroke?: string; // color

    constructor(options?: RebinSpec) {
        if(options) Object.assign(this, options);
    }
}

export class RescaleSpec {
    type:"linear"|"log"|"pow"|"sqrt"|"cbrt"|"equidepth" = "linear";
    level:number = 32; // for equidepth

    constructor(options?: RescaleSpec) {
        if(options) Object.assign(this, options);
    }
}

export class ContourSpec {
    stroke:number = 0;
    fill:number = 0; // percentile over which we fill
    values?:number[]; // percentiles to stroke
    blur:number=2;

    constructor(options?: ContourSpec) {
        if(options) Object.assign(this, options);
    }
}

export class LegendSpec {
    format:string = ".2s";
    fontSize:string = "12px";
    fontFamily:string = "sans-serif";

    rowHeight:number = 15;
    gutter:number = 5;
    labelWidth:number = 40;
    colorMapWidth:number = 120;

    tickFontSize:string = "10px";

    markers:number = 3;
    numTicks?:number;

    // multiplicative circles
    size:number = 150;

    // bars
    width:number = 50;
    height:number = 50;

    constructor(options?: LegendSpec) {
        if(options) Object.assign(this, options);
    }
}

export class Configuration {
    description?: string;
    background?: string;
    data?: ConfigurationDataSpec;
    blur: number = 0;
    reencoding?: ConfigurationReencodingSpec;
    rebin?: RebinSpec;
    compose?: ComposeSpec;
    rescale?: RescaleSpec;
    contour?:ContourSpec;
    width: number = -1;
    height: number= -1;
    bufferNames:string[] = [];
    legend: LegendSpec | false = new LegendSpec();

    constructor(public specs:any) {
        if(typeof this.specs === 'string') {
            this.specs = JSON.parse(this.specs as string);
        }

        this.parseDescription();
        this.parseBackground();
        this.parseData();
        this.parseSmooth();
        this.parseDerivedBuffers();
        this.parseReencoding();
        this.parseRebin();
        this.parseCompose();
        this.parseRescale();
        this.parseContour();
        this.parseLegend();
    }

    private parseDescription() {
        if ('description' in this.specs)
            this.description = this.specs.description;
    }
    private parseBackground() {
        if ('background' in this.specs)
            this.background = this.specs.background;
    }
    private parseData() {
        this.data = <ConfigurationDataSpec>this.specs.data;
    }
    private parseSmooth() {
        if ('smooth' in this.specs) {
            if (this.specs.smooth.radius)
                this.blur = <number>this.specs.smooth.radius;
        }
    }
    private parseContour() {
        if ('contour' in this.specs) {
            this.contour = new ContourSpec(this.specs.contour);
        }
    }
    private parseDerivedBuffers() {
    }
    private parseReencoding() {
        this.reencoding = <ConfigurationReencodingSpec>this.specs.reencoding;
    }
    private parseRebin() {
        if (this.specs.rebin)
            this.rebin = new RebinSpec(this.specs.rebin);
    }
    private parseCompose() {
        if (this.specs.compose) {
            this.compose = new ComposeSpec(this.specs.compose)
            if(this.specs.compose.glyphSpec) {
                this.compose.glyphSpec = new GlyphSpec(this.specs.compose.glyphSpec);
            }
        }
    }

    private parseRescale() {
        if (this.specs.rescale)
            this.rescale = new RescaleSpec(this.specs.rescale);
    }

    public validate():boolean {
        if (! this.data)
            return false;
        let widths = new Map<string,number>(), heights = new Map<string,number>();
        let data = this.data.dataSpec;
        if (! data ||
            ! data.encoding ||
            ! data.encoding.x ||
            ! data.encoding.y ||
            ! data.buffers)
            return false;
        let x_enc = data.encoding.x,
            y_enc = data.encoding.y;
        let x = undefined, y = undefined;
        if (x_enc) {
            if (x_enc.bin && 'maxbins' in x_enc.bin && x_enc.bin.maxbins)
                widths.set('maxbins', x_enc.bin.maxbins);
            if (x_enc.scale && x_enc.scale.range &&
                x_enc.scale.range instanceof Array && x_enc.scale.range.length > 1)
                widths.set('range', x_enc.scale.range[1]);
        }
        if (y_enc) {
            if (y_enc.bin && 'maxbins' in y_enc.bin && y_enc.bin.maxbins)
                heights.set('maxbins', y_enc.bin.maxbins);
            if (y_enc.scale && y_enc.scale.range &&
                y_enc.scale.range instanceof Array && y_enc.scale.range.length > 1)
                heights.set('range', y_enc.scale.range[1]);
        }
        let error = '';
        this.bufferNames = [];
        data.buffers.forEach((buffer, i) => {
            if (buffer.value)
                this.bufferNames.push(buffer.value);
            else
                this.bufferNames.push(""+i);
            if (buffer.data instanceof Array) {
                heights.set(buffer.value, buffer.data.length);
                widths.set(buffer.value, buffer.data[0].length);
            }
            else {
                error = 'invalid buffer '+buffer.value;
            }
        });
        widths.forEach((width, k) => {
            if (this.width == -1)
                this.width = width;
            else if (this.width != width) {
                console.log('Inconsistent widths for '+k+' :'+width+' instead of '+this.width);
                error = k;
            }
        });
        heights.forEach((height, k) => {
            if (this.height == -1)
                this.height = height;
            else if (this.height != height) {
                console.log('Inconsistent heights for '+k+' :'+height+' instead of '+this.height);
                error = k;
            }
        });
        if (error != '')
            return false;
        return true;
    }

    loadTopojson(base:string = '') : Promise<Configuration> {
        if (this.rebin &&
            this.rebin.url != undefined && this.rebin.topojson == undefined) {
            return util
                  .get(base + this.rebin.url)
                  .then(response => {
                      console.log('Loaded topojson at '+(base+this.rebin!.url!));
                      this.rebin!.topojson = JSON.parse(response);
                      return this;
                  })
                  .catch((reason)=> {
                      console.log('Cannot load topojson at '+(base+this.rebin!.url!)+': '+reason);
                      return this;
                  });
        }
        return Promise.resolve(this);
    }

    // load data from the server if this.data contains url
    load(base:string = ''): Promise<Configuration> {
        if(!this.data!.dataSpec && this.data!.url) {
            return util
                  .get(base + this.data!.url!)
                  .then(response => {
                      console.log('Loaded configuration data at '+(base+this.data!.url!));
                      let dataSpec = new DataSpec(JSON.parse(response));
                      this.data!.dataSpec = dataSpec;

                      return dataSpec
                            .load(base)
                            .then(() => {
                                return this.loadTopojson(base);
                            });
                  })
                  .catch((reason)=> {
                      console.log('Cannot load topojson at '+(base+this.rebin!.url!)+': '+reason);
                      return this;
                  });
        }

        return this.loadTopojson(base).then(() => {return this;});
    }

    public getBuffers() : DataBuffer[] {
        let data = this.data;
        if (! data ||
            ! data.dataSpec ||
            ! data.dataSpec.buffers)
            return [];
        let buffers = data.dataSpec.buffers;
        let dataBuffers = data.dataSpec.buffers.map((bufferSpec) =>
              new DataBuffer(bufferSpec.value,
                             this.width,
                             this.height,
                             bufferSpec.data));
        return dataBuffers;
    }

    public getLabels(): string[] | undefined  {
        if (! this.reencoding
            || ! this.reencoding.label
            || ! this.reencoding.label.scale
            || ! this.reencoding.label.scale.range)
            return undefined;
        return this.reencoding.label.scale.range;
    }

    public getColors(): string[]  {
        if (! this.reencoding
            || ! this.reencoding.color
            || ! this.reencoding.color.scale
            || ! this.reencoding.color.scale.range)
            return [];
        return this.reencoding.color.scale.range;
    }

    public getGeo():GeoSpec {
        let geo = this.data!.dataSpec!.geo;

        if (this.specs.rebin != undefined &&
            this.specs.rebin.proj4 != undefined)
            geo.proj4 = this.specs.rebin.proj4;
        return geo;
    }

    private parseLegend() {
        if(this.specs.legend === false)
            this.legend = false;
        else if(this.specs.legend)
            this.legend = new LegendSpec(this.specs.legend);
    }
}

export function parse(json: any): Configuration {
    return new Configuration(json);
}


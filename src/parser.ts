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

export interface ProjectionSpec {
    type: string;
}

export class DataSpec {
    public source?: SourceSpec;
    public projection?: ProjectionSpec;
    public encoding?: EncodingSpec;
    public buffers?: BufferSpec[];

    constructor(public specs:any) {
        this.parseSource();
        this.parseProjection();
        this.parseEncoding();
        this.parseBuffers();
    }

    parseSource() {
        if ('source' in this.specs)
            this.source = <SourceSpec>this.specs.source;
    }
    parseProjection() {
        if ('projection' in this.specs)
            this.projection = <ProjectionSpec>this.specs.projection;
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
          "hatching"|"separate"="mean";
    mixing: "additive"|"subtractive" = "additive";
    size:number = 8;
    proportional:boolean = true;
    select?:number;
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
}

export class ContourSpec {
    stroke:number = 0;
    fill:number = 0; // percentile over which we fill
    values?:number[]; // percentiles to stroke
    blur:number=2;
}

export class Configuration {
    description?: string;
    background?: string;
    data?: ConfigurationDataSpec;
    blur: number = 0;
    reencoding?: ConfigurationReencodingSpec;
    rebin?: RebinSpec;
    compose?: ComposeSpec;
    rescale: "none"|"linear"|"log"|"pow"|"sqrt"|"cbrt"|"equidepth" = "none";
    contour?:ContourSpec;
    width: number = -1;
    height: number= -1;
    bufferNames:string[] = [];

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
            this.contour = this.specs.contour;
        }
    }
    private parseDerivedBuffers() {
    }
    private parseReencoding() {
        this.reencoding = <ConfigurationReencodingSpec>this.specs.reencoding;
    }
    private parseRebin() {
        if (this.specs.rebin)
            this.rebin = this.specs.rebin;
    }
    private parseCompose() {
        if (this.specs.compose)
            this.compose = this.specs.compose
    }

    private parseRescale() {
        if (this.specs.rescale)
            this.rescale = this.specs.rescale.type;
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
        var x = undefined, y = undefined;
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
        var error = '';
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
        let dict = new Map<string,string>();
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

}

export function parse(json: any): Configuration {
    return new Configuration(json);
}


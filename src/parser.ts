import * as util from './util';
import * as d3 from 'd3';

export interface SourceSpec {
    filename?: string;
    type?: string;
    rows?: number;
}

export interface ProjectionSpec {
    type: string;
}

export interface XYEncodingBinSpec {
    maxbins?: number;
}

export interface XYEncodingScaleSpec {
    domain: [number, number];
    range: [number, number];
}

export interface XYEncodingSpec {
    field: string;
    type?: string; // specify quantitative, latitude, longitude
    bin?: XYEncodingBinSpec;
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
                    console.log('Loaded '+buffer.url);
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
    assembly?: {type: string};
    colorspace?: string;
    mixing?: string
}

export interface ConfigurationReencodingFacetSpec {
    value?: boolean;
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
    facet?: ConfigurationReencodingFacetSpec;
    hatching?: ConfigurationReencodingHatchingSpec;
}

export class Configuration {
    description?: string;
    background?: string;
    data?: ConfigurationDataSpec;
    reencoding?: ConfigurationReencodingSpec;
    rebin: any;
    valid?: boolean;
    width?: number;
    height?: number;

    constructor(public specs:any) {
        if(typeof this.specs === 'string') {
            this.specs = JSON.parse(this.specs as string);
        }

        this.parseDescription();
        this.parseBackground();
        this.parseData();
        this.parseDerivedBuffers();
        this.parseReencoding();
        this.parseRebin();
    }

    parseDescription() {
        if ('description' in this.specs)
            this.description = this.specs.description;
    }
    parseBackground() {
        if ('background' in this.specs)
            this.background = this.specs.background;
    }
    parseData() {
        this.data = <ConfigurationDataSpec>this.specs.data;
    }
    parseDerivedBuffers() {
    }
    parseReencoding() {
        this.reencoding = <ConfigurationReencodingSpec>this.specs.reencoding;
    }
    parseRebin() {
        if (this.specs.rebin)
            this.rebin = this.specs.rebin;
    }

    public validate():boolean {
        if (this.valid != undefined)
            return this.valid;
        if (! this.data)
            return false;
        let data = this.data.dataSpec;
        if (! data || ! data.encoding || ! data.encoding.x || ! data.encoding.y)
            return false;
        let x_enc = data.encoding.x,
            y_enc = data.encoding.y;
        var x = undefined, y = undefined;
        if (x_enc && x_enc.bin && 'maxbins' in x_enc.bin)
            x = x_enc.bin;
        if (y_enc && y_enc.bin && 'maxbins' in y_enc.bin)
            y = y_enc.bin;
        return false;
    }

    // load data from the server if this.data contains url
    load(base:string = '') {
        if(!this.data!.dataSpec && this.data!.url) {
            console.log('Loading '+this.data!.url!);
            return util.get(base + this.data!.url!).then(response => {
                let dataSpec = new DataSpec(JSON.parse(response));

                return dataSpec.load(base).then(() => {
                    this.data!.dataSpec = dataSpec;
                    return this;
                });
            })
        }

        return Promise.resolve(this);
    }
}

export function parse(json: any): Configuration {
    return new Configuration(json);
}


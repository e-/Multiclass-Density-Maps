import * as util from './util';

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
                    buffer.data = JSON.parse(data);
                })

                requests.push(promise);
            }
        })

        return Promise.all(requests);
    }

    // resolve_buffer_url(buffer:BufferSpec, json: any) {
    //     buffer.data = <number[][]>json;
    // }
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

export interface ConfigurationReencodingColorSpec {
    field: string;
    type?: string; // specify nominal
    scale: ConfigurationReencodingColorScaleSpec;
}

export interface ConfigurationReencodingSpec {
    label?: ConfigurationReencodingLabelSpec;
    color?: ConfigurationReencodingColorSpec;
}

export class Configuration {
    description?: string;
    background?: string;
    data?: ConfigurationDataSpec;
    reencoding?: ConfigurationReencodingSpec;
    rebin: any;

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

    // public resolve_data_url(json: any) {
    //     if (! this.data) return;
    //     let data = new DataSpec(json);
    //     data.parse();
    //     this.data.data = data;
    // }

    public width(): number {
        return 512;
    }

    public height(): number {
        return 512;
    }

    // load data from the server if this.data contains url
    load(base:string = '') {
        if(!this.data!.dataSpec && this.data!.url) {
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

// Interpreter from a parsed specification

import * as Parser from './parser';
import DataBuffer from './data-buffer';
import DerivedBuffer from './derived-buffer';
import CanvasRenderer from './canvas-renderer';
import Image from './image';
import * as Tiling from './tiling';
import Tile, {TileAggregation} from './tile';
import Color from './color';
import Composer from './composer';
import * as Scale from './scale';
import * as util from './util';
import Mask from './mask';
import {gaussian_blur} from './gaussian-blur';

export default class Interpreter {
    public width: number;
    public height: number;
    public n:number = 0;
    public sourceBuffers:DataBuffer[] = [];
    public dataBuffers:DataBuffer[] = [];
    public derivedBuffers: DerivedBuffer[] = [];
    public image:Image;
    public tiles:Tile[] = [];
    public tileAggregation=TileAggregation.Mean;
    public strokeCanvas:boolean = false;
    public backgroundStroke = "grey";
    public fillCanvas:boolean = true;
    public background = "white";
    public bufferNames:string[];
    public colors:Color[] = Color.Category10;
    public labels:Map<string,string>;
    public rebin: any;
    public rescale:"none"|"linear"|"log"|"pow"|"sqrt"|"cbrt"|"equidepth" = "none";
    public compose:Parser.ComposeSpec;
    public composer:(buffers:DerivedBuffer[], values:number[])=>Color = Composer.none;
    public masks:Mask[] = [];
    public blur:number=0;

    constructor(public configuration:Parser.Configuration) {
        if (! configuration.validate())
            throw "Invalid configuration";
        this.width = configuration.width!;
        this.height = configuration.height!;
        this.image = new Image(this.width, this.height);
        this.bufferNames = configuration.bufferNames;
        this.n = this.bufferNames.length;
        this.sourceBuffers = configuration.getBuffers();
        this.dataBuffers = this.sourceBuffers;
        this.labels = configuration.getLabels();
        let colormap = configuration.getColors();
        if (colormap.length >= this.bufferNames.length)
            this.colors = colormap.map((name)=>Color.byName(name));
        else if (colormap.length != 0) {
            console.log('Not enough colors in colormap, ignored');
        }
        this.rebin = configuration.rebin;
        if (configuration.compose === undefined)
            this.compose = new Parser.ComposeSpec();
        else
            this.compose = configuration.compose;
        if (configuration.rescale)
            this.rescale = configuration.rescale;
        if (configuration.blur)
            this.blur = configuration.blur;
    }

    public interpret(context={}) {
        this.computeDerivedBuffers(context);
        this.computeReencoding(context);
        this.computeRebin(context);
        this.computeCompose(context);
    }

    computeDerivedBuffers(context={}) {
        if (this.blur > 0) {
            var newbuffers = this.dataBuffers.map((dataBuffer):number[][] => {
                let source = Array.prototype.concat.apply(dataBuffer.values[0],
                                                              dataBuffer.values.slice(1)),
                    target = new Array(this.width*this.height);
                gaussian_blur(source, target, this.width, this.height, this.blur);
                var new_array = Array(this.height);
                for (var i = 0; i < this.height; i++) 
                    new_array[i] = target.slice(i*this.width, (i+1)*this.width);
                return new_array;
            });
            this.dataBuffers = newbuffers.map((values:number[][], i:number) => {
                return new DataBuffer(this.dataBuffers[i].name, this.width, this.height, values);
            });
        }
    }

    computeRebin(context={}) {
        var tiles = this.tiles;
        if (this.rebin.type===undefined || this.rebin.type=="none") {
            console.log('No rebin');
            tiles = Tiling.pixelTiling(this.width,
                                        this.height);
        }
        else if (this.rebin.type == "square") {
            let size = this.rebin.size || 10;
            console.log('Square rebin size='+size);
            tiles = Tiling.rectangularTiling(this.width,
                                              this.height,
                                              size, size);
        }
        else if (this.rebin.type == "rect") {
            let width = this.rebin.width || 10,
                height = this.rebin.height || 10;
            console.log('Square rebin w='+width+' h='+height);
            tiles = Tiling.rectangularTiling(this.width,
                                              this.height,
                                              width, height);
        }
        else if (this.rebin.type == "topojson") {
            let url = this.rebin.url,
                feature = this.rebin.feature || null;
            console.log('topojson rebin url='+url
                        +' feature='+feature);
            // TODO get the projection, transform, clip, etc.
            tiles = Tiling.topojsonTiling(this.width,
                                           this.height,
                                           feature);
        }
        else if (this.rebin.type == "voronoi") {
            let points = this.rebin.sites || 4;
            console.log('voronoi rebin sites='+points);
            tiles = Tiling.voronoiTiling(this.width,
                                          this.height,
                                          points);
        }
        this.tiles = tiles;
    }

    computeReencoding(context={}) {
    }

    computeCompose(context={}) {        
        if (this.compose.mix === "max")
            this.composer = Composer.max;
        else if (this.compose.mix === "mean")
            this.composer = Composer.mean;
        else if (this.compose.mix === "min")
            this.composer = Composer.min;
        else if (this.compose.mix === "blend")
            this.composer = Composer.additiveMix;
        else if (this.compose.mix === "weavingrandom")
            this.masks = Mask.generateWeavingRandomMasks(this.n,
                                                         this.compose.tilesize||8,
                                                         this.width, this.height);
        else if (this.compose.mix === "weavingsquare")
            this.masks = Mask.generateWeavingSquareMasks(this.n,
                                                         this.compose.tilesize||8,
                                                         this.width, this.height);
        else if (this.compose.mix === "weavinghex")
            this.masks = Mask.generateWeavingHexaMasks(this.n,
                                                       this.compose.tilesize||8,
                                                       this.width, this.height);
    }

    render(id:string) {
        for (let tile of this.tiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, this.tileAggregation);
        }
        var scale:Scale.ScaleTrait;
        let maxCount = util.amax(this.tiles.map(tile => util.amax(tile.dataValues)));
        // TODO test if scales are per-buffer or shared, for now, we'll make one per buffer
        if (this.rescale === "none" || this.rescale === "linear")
            scale = new Scale.LinearScale([0, maxCount], [0, 1]);
        else if (this.rescale === "sqrt") 
            scale = new Scale.SquareRootScale([0, maxCount], [0, 1]);
        else if (this.rescale === "cbrt") 
            scale = new Scale.CubicRootScale([0, maxCount], [0, 1]);
        else if (this.rescale === "log") 
            scale = new Scale.LogScale([1, maxCount], [0, 1]);
        else if (this.rescale === "equidepth") {
            let equidepth = new Scale.EquiDepthScale([]);
            for (let tile of this.tiles)
                equidepth.addPoints(tile.dataValues);
            equidepth.computeBounds();
            scale = equidepth;
        }
        
        
        this.derivedBuffers = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);
            derivedBuffer.colorScale = new Scale.ColorScale([Color.White, this.colors[i]], scale);
            if (this.masks.length > i)
                derivedBuffer.mask = this.masks[i];
            return derivedBuffer;
        });

        if (this.composer != Composer.none) {
            for(let tile of this.tiles) {
                let color = this.composer(this.derivedBuffers, tile.dataValues);
                this.image.render(color, tile);
            }
        }
        else if (this.masks.length > 0) { // no composer
            for (let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                    this.image.render(color, tile, derivedBuffer.mask);
                });
            }
        }
        else 
            console.log('No valid composition');
        //CanvasRenderer.render(image, id);
        let ctx = CanvasRenderer.render(this.image, id);
        // if (this.strokeCanvas) {
        //     ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        //     ctx.strokeStyle = this.backgroundStroke;
        //     ctx.lineWidth = 2;
        //     ctx.strokeRect(0, 0, this.width, this.height);
        // }
    }

}


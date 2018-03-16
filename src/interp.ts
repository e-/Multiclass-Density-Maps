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
import LegendBuilder from './legend';
import * as d3 from 'd3';

export default class Interpreter {
    public description?: string;
    public width: number;
    public height: number;
    public n:number = 0;
    public sourceBuffers:DataBuffer[] = [];
    public dataBuffers:DataBuffer[] = [];
    public derivedBuffers: DerivedBuffer[] = [];
    public image:Image[] = [];
    public tiles:Tile[] = [];
    public tileAggregation=TileAggregation.Mean;
    public strokeCanvas:boolean = false;
    public backgroundStroke = "grey";
    public fillCanvas:boolean = true;
    public background = "white";
    public bufferNames:string[];
    public colors:Color[] = Color.Category10;
    public labels?:string[];
    public rebin: any;
    public rescale:"none"|"linear"|"log"|"pow"|"sqrt"|"cbrt"|"equidepth" = "none";
    public compose:Parser.ComposeSpec;
    public composer:(buffers:DerivedBuffer[], values:number[])=>Color = Composer.none;
    public masks:Mask[] = [];
    public maskStroke?:string;
    public contour = 0;
    public blur:number=0;

    constructor(public configuration:Parser.Configuration) {
        if (! configuration.validate())
            throw "Invalid configuration";
        this.description = configuration.description;
        this.width = configuration.width!;
        this.height = configuration.height!;
        if (configuration.background)
            this.background = configuration.background;
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
        if (configuration.contour)
            this.contour = configuration.contour;
    }

    public interpret(context={}) {
        this.computeDerivedBuffers(context);
        this.computeReencoding(context);
        this.computeRebin(context);
        this.computeCompose(context);

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
            let equidepth = new Scale.EquiDepthScale([1, maxCount], [0, 1]);
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

    }

    private computeDerivedBuffers(context={}) {
        if (this.blur > 0) {
            let newbuffers = this.dataBuffers.map(dataBuffer => dataBuffer.blur(this.blur));
            this.dataBuffers = newbuffers;
        }
    }

    private computeRebin(context={}) {
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
                topojson = this.rebin.topojson,
                feature = this.rebin.feature || null; //CHECK
            console.log('topojson rebin url='+url
                        +' feature='+feature);
            // TODO get the projection, transform, clip, etc.
            tiles = Tiling.topojsonTiling(this.width,
                                           this.height,
                                          topojson, topojson.objects[feature]);
        }
        else if (this.rebin.type == "voronoi") {
            if (this.rebin.points) {
                let points:[number, number][] = this.rebin.points;
                console.log('voronoi rebin sites='+points);
                tiles = Tiling.voronoiTiling(this.width,
                                             this.height,
                                             0, points);
            }
            else {
                let sites = this.rebin.size || 10;
                tiles = Tiling.voronoiTiling(this.width,
                                             this.height,
                                             sites);
            }
        }
        if (this.rebin && this.rebin.stroke)
            this.maskStroke = this.rebin.stroke;
        this.tiles = tiles;
    }

    private computeReencoding(context={}) {
    }

    private computeCompose(context={}) {
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
                                                         this.compose.size||8,
                                                         this.width, this.height);
        else if (this.compose.mix === "weavingsquare")
            this.masks = Mask.generateWeavingSquareMasks(this.n,
                                                         this.compose.size||8,
                                                         this.width, this.height);
        else if (this.compose.mix === "weavinghex")
            this.masks = Mask.generateWeavingHexaMasks(this.n,
                                                       this.compose.size||8,
                                                       this.width, this.height);
        else if (this.compose.mix === "weavingtri")
            this.masks = Mask.generateWeavingTriangleMasks(this.n,
                                                           this.compose.size||8,
                                                           this.width, this.height);
    }

    setup(id:string) {
        let canvas:any = document.getElementById(id);
        canvas.width   = this.width;
        canvas.height  = this.height;
        canvas.style.backgroundColor = this.background;
        if (this.description != undefined)
            canvas.setAttribute("title", this.description);
    }

    render(id:string) {
        if (this.compose.mix === "separate") { // small multiples
            this.image = this.derivedBuffers.map((b) => new Image(this.width, this.height));
            for(let tile of this.tiles) {
                let color = this.composer(this.derivedBuffers, tile.dataValues);
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = Composer.one(derivedBuffer, tile.dataValues[i]);
                    this.image[i].render(color, tile);
                });
            }
        }
        else {
            this.image = [new Image(this.width, this.height)];
        }
        if (this.composer != Composer.none) {
            for(let tile of this.tiles) {
                let color = this.composer(this.derivedBuffers, tile.dataValues);
                this.image[0].render(color, tile);
            }
        }
        else if (this.masks.length > 0) { // no composer
            for (let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                    this.image[0].render(color, tile, derivedBuffer.mask);
                });
            }
        }
        else if (this.compose.mix === "hatching") {
            for(let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer:DerivedBuffer, i:number) => {
                    derivedBuffer.color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                });

                let hatch = Composer.hatch(tile, this.derivedBuffers,
                                           this.compose.size,
                                           this.compose.proportional);
                this.image[0].render(hatch, tile.center());
            }
        }
        else
            console.log('No valid composition');

        let ctx = CanvasRenderer.renderAll(this.image, id, this.compose.select);
        if (this.contour > 0) {
            // Assume all the scales are shared between derived buffers
            let path       = d3.geoPath(null, ctx),
                thresholds = this.derivedBuffers[0].thresholds(this.contour);

            ctx.strokeStyle = 'black';
            
            this.derivedBuffers.forEach((derivedBuffer, i) => {
                let geometries = derivedBuffer.contours(thresholds, 8),
                    colors = thresholds.map(v => derivedBuffer.colorScale.map(v));
                geometries.forEach((geo,i) => {
                    ctx.beginPath();
                    path(geo);
                    ctx.strokeStyle = colors[i].hex();
                    ctx.stroke();
                });
            });
        }
        if (this.maskStroke)
            for(let tile of this.tiles)
                CanvasRenderer.strokeVectorMask(tile.mask, id, {color: this.maskStroke});
        // if (this.strokeCanvas) {
        //     ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        //     ctx.strokeStyle = this.backgroundStroke;
        //     ctx.lineWidth = 2;
        //     ctx.strokeRect(0, 0, this.width, this.height);
        // }
    }

    renderLegend(id:string) {
        LegendBuilder(id, this);
    }

}


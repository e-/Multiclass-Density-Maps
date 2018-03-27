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
import * as Weaving from './weaving';
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
    public blurredBuffers: DerivedBuffer[] = [];
    public image:Image[] = [];
    public tiles:Tile[] = [];
    public tileAggregation=TileAggregation.Mean;
    public strokeCanvas:boolean = false;
    public backgroundStroke = "grey";
    public fillCanvas:boolean = true;
    public background?:string;
    public bufferNames:string[];
    public colors0:Color[] = Color.Category10t;
    public colors1:Color[] = Color.Category10;
    public labels?:string[];
    public rebin: any;
    public rescale:Parser.RescaleSpec;
    public compose:Parser.ComposeSpec;
    public composer:(buffers:DerivedBuffer[], values:number[])=>Color = Composer.none;
    public masks:Mask[] = [];
    public maskStroke?:string;
    public contour:Parser.ContourSpec;
    public blur:number=0;
    public geo:Parser.GeoSpec;
    public legend:Parser.LegendSpec | false;
    public scale:Scale.ScaleTrait = new Scale.LinearScale([0, 1], [0, 1]);
    public xdomain:Parser.NumPair;
    public ydomain:Parser.NumPair;
    public stroke?:Parser.StrokeSpec;

    // d3 name of scale, used for legend
    public d3scale:string = "linear";
    public d3base:number = 10;

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

        let colormap0 = configuration.getColors0();
        if (colormap0.length >= this.bufferNames.length)
            this.colors0 = colormap0.map((name)=>Color.get(name));
        else if (colormap0.length != 0) {
            console.log('  WARNING: Not enough colors(0) in colormap, ignored');
        }

        let colormap1 = configuration.getColors1();
        if (colormap1.length >= this.bufferNames.length)
            this.colors1 = colormap1.map((name)=>Color.get(name));
        else if (colormap1.length != 0) {
            console.log('  WARNING: Not enough colors(1) in colormap, ignored');
        }

        this.rebin = configuration.rebin;
        if (configuration.compose === undefined)
            this.compose = new Parser.ComposeSpec();
        else
            this.compose = configuration.compose;
        if (configuration.rescale)
            this.rescale = configuration.rescale;
        else
            this.rescale = new Parser.RescaleSpec();
        if (configuration.blur)
            this.blur = configuration.blur;
        if (configuration.contour === undefined)
            this.contour = new Parser.ContourSpec();
        else
            this.contour = configuration.contour;

        this.stroke = configuration.stroke;

        this.geo = configuration.getGeo();
        this.legend = configuration.legend;
        this.xdomain = configuration.getXDomain();
        this.ydomain = configuration.getYDomain();
    }

    public interpret(context={}) {
        this.computeDerivedBuffers(context);
        this.computeRebin(context);
        this.computeCompose(context);

        for (let tile of this.tiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, this.tileAggregation);
        }
        let maxCount = util.amax(this.tiles.map(tile => tile.maxValue()));
        // TODO test if scales are per-buffer or shared, for now, we'll make one per buffer
        if (this.rescale.type === "linear")
            this.scale = new Scale.LinearScale([0, maxCount], [0, 1]);
        else if (this.rescale.type === "sqrt")
            this.scale = new Scale.SquareRootScale([0, maxCount], [0, 1]);
        else if (this.rescale.type === "cbrt")
            this.scale = new Scale.CubicRootScale([0, maxCount], [0, 1]);
        else if (this.rescale.type === "log")
            this.scale = new Scale.LogScale([1, maxCount], [0, 1]);
        else if (this.rescale.type === "equidepth") {
            let equidepth = new Scale.EquiDepthScale([1, maxCount], [0, 1], this.rescale.levels);
            for (let tile of this.tiles)
                equidepth.addPoints(tile.dataValues);
            equidepth.computeBounds();
            this.scale = equidepth;
        }
        else {
            throw `undefined rescale type: ${this.rescale.type}`;
        }

        this.derivedBuffers = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);
            derivedBuffer.colorScale = new Scale.ColorScale([this.colors0[i], this.colors1[i]], this.scale); //
            derivedBuffer.color = this.colors1[i];
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
        if(this.rebin) {
            if(this.rebin!.aggregation === "max") {
                this.tileAggregation = TileAggregation.Max;
            }
            else if(this.rebin!.aggregation === "min") {
                this.tileAggregation = TileAggregation.Min;
            }
            else if(this.rebin!.aggregation === "mean") {
                this.tileAggregation = TileAggregation.Mean;
            }
            else if(this.rebin!.aggregation === "sum") {
                this.tileAggregation = TileAggregation.Sum;
            }
        }

        if (this.rebin===undefined ||
            this.rebin.type===undefined ||
            this.rebin.type=="none") {
            console.log('  Pixel rebin');
            tiles = Tiling.pixelTiling(this.width,
                                       this.height);
        }
        else if (this.rebin.type == "square") {
            let size = this.rebin.size || 10;
            console.log('  Square rebin size='+size);
            tiles = Tiling.rectangularTiling(this.width,
                                              this.height,
                                              size, size);
        }
        else if (this.rebin.type == "rect") {
            let width = this.rebin.width || 10,
                height = this.rebin.height || 10;
            console.log('  Square rebin w='+width+' h='+height);
            tiles = Tiling.rectangularTiling(this.width,
                                              this.height,
                                              width, height);
        }
        else if (this.rebin.type == "topojson") {
            let url      = this.rebin.url,
                topojson = this.rebin.topojson,
                feature  = this.rebin.feature || null; //CHECK
            console.log('  topojson rebin url='+url
                        +' feature='+feature);
            // TODO get the projection, transform, clip, etc.

            if (!topojson.objects[feature] ||
                !topojson.objects[feature].geometries ||
                !Array.isArray(topojson.objects[feature].geometries) ||
                topojson.objects[feature].geometries.length==0 ){
              console.log("  ERROR: no correct array named 'geometries' in the specified feature("+feature+"). Is it really topojson or did you specify wrong feature name?");
            }
            //[jdf] for now, ignore min/maxfeature
            // remove unnecessary features like far islands ...
            // if (this.rebin.maxfeature != undefined && this.rebin.maxfeature > 0)
            //   topojson.objects[feature].geometries.splice(this.rebin.maxfeature,
            //                                               topojson.objects[feature].geometries.length-this.rebin.maxfeature);

            // if (this.rebin.minfeature != undefined && this.rebin.minfeature>0)
            //   topojson.objects[feature].geometries.splice(0, this.rebin.minfeature);

            let projection = this.geo.proj4 || this.geo.projection;
            tiles = Tiling.topojsonTiling(this.width, this.height,
                                          topojson,
                                          topojson.objects[feature],
                                          projection,
                                          this.geo.latitudes, this.geo.longitudes,
                                          this.rebin.minfeature==-1);
        }
        else if (this.rebin.type == "voronoi") {
            if (this.rebin.points) {
                let points:[number, number][] = this.rebin.points;
                console.log('  voronoi rebin sites='+points);
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
        if (this.rebin != undefined && this.rebin.stroke)
            this.maskStroke = this.rebin.stroke;
        this.tiles = tiles;
    }

    private computeCompose(context={}) {
        if (this.compose.mix === "max")
            this.composer = Composer.max;
        else if (this.compose.mix === "mean")
            this.composer = Composer.mean;
        else if (this.compose.mix === "min")
            this.composer = Composer.min;
        else if (this.compose.mix === "blend") {
            if(this.compose.mixing === "multiplicative")
                this.composer = Composer.multiplicativeMix;
            else
                this.composer = Composer.additiveMix;
        }
        else if (this.compose.mix === "weavingrandom")
            this.masks = Weaving.randomMasks(this.n,
                                             this.compose.size||8,
                                             this.width, this.height);
        else if (this.compose.mix === "weavingsquare")
            this.masks = Weaving.squareMasks(this.n,
                                             this.compose.size||8,
                                             this.width, this.height);
        else if (this.compose.mix === "weavinghex")
            this.masks = Weaving.hexMasks(this.n,
                                          this.compose.size||8,
                                          this.width, this.height);
        else if (this.compose.mix === "weavingtri")
            this.masks = Weaving.triangleMasks(this.n,
                                               this.compose.size||8,
                                               this.width, this.height);
    }

    setup(id:string|HTMLCanvasElement) {
        let canvas = id instanceof HTMLCanvasElement ? id :
              document.getElementById(id) as HTMLCanvasElement;
        canvas.width   = this.width;
        canvas.height  = this.height;
        if (this.background != undefined)
            canvas.style.backgroundColor = this.background;
        if (this.description != undefined)
            canvas.setAttribute("title", this.description);
    }

    render(id:string|HTMLCanvasElement) {
        let canvas = id instanceof HTMLCanvasElement ? id :
              document.getElementById(id) as HTMLCanvasElement;
        let promises = [];
        if (this.compose.mix === "separate") { // small multiples
            this.image = this.derivedBuffers.map((b) => new Image(this.width, this.height));
            for(let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = Composer.one(derivedBuffer, tile.dataValues[i]);
                    this.image[i].render(color, tile);
                });
            }
        }
        else if (this.compose.mix === "time") { // time multiplexing
            this.image = this.derivedBuffers.map((b) => new Image(this.width, this.height));
            for(let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = Composer.one(derivedBuffer, tile.dataValues[i]);
                    this.image[i].render(color, tile);
                });
            }
        }
        else {
            this.image = [new Image(this.width, this.height)];
        }

        // Need the tiles to compute dot density plots
        if (this.compose.mix === "dotdensity") {

            // create one mask per databuffer
            let masks:Mask[] = Array<Mask>(this.derivedBuffers.length);
            for (let i = 0; i < this.derivedBuffers.length; i++) {
              masks[i] = new Mask(this.width, this.height, 0);
            }

            let rowcounts = this.tiles.map(tile => tile.rowcounts());
            let areas     = rowcounts.map(rc => rc[rc.length-1]);
            let biggest   = util.amax(areas);
            let densities = this.tiles.map((tile, i) => {
                let area = areas[i];
                return area == 0 ? 0 : tile.sumValue() / (area-1);
            });
            let maxDensity = util.amax(densities);
            let rawMask  = new Uint8Array(biggest);

            this.tiles.forEach(function (tile, k) {
              // create a local mask to store all the values together before dispathing them in every mask for every databuffer
              //let buffer = new ArrayBuffer(tile.mask.width*tile.mask.height);
              //let mask = Array<Uint8ClampedArray>(tile.mask.height);
              //for (let j = 0; j < tile.mask.height; j++) {
              //    mask[j] = new Uint8ClampedArray(buffer, j*tile.mask.width, tile.mask.width);
              //    mask[j].set(tile.mask.mask[j]);
              //}
              // proportion and suming
              let acc =0;
              let pixCounts = tile.dataValues.map(function(v){acc+=v/maxDensity; return acc;});

              // for every buffer we want to distribute a given number of points in its mask.
              // to do so we create a buffer of values to distriibute among the buffer masks.
              // values 1+2 will fall where the mask of buffer#1 should display something.
              // values 2+2 will fall where the mask of buffer#2 should display something, etc.
              // values 0 and 1 already lies in the masks and mean the mask is filled or not.
              // in the end mask can only display something where there was a 1 before.
              let prev = 0;
              pixCounts.forEach (function(pc, j){
                rawMask.fill(j+1, prev, Math.round(pc));
                prev=Math.floor(pc);
              });
              // finish with special values that will fall in no buffer in the end
              rawMask.fill(0, prev, areas[k]);

              // shuffle
              for (let i = areas[k]-1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rawMask[i], rawMask[j]] = [rawMask[j], rawMask[i]];
              }

              // dispatch the values in the straight array toward the masks (only where there are 1 in the tile's mask)
              acc = 0;
              for (let j = 0; j < tile.mask.mask.length; j++) {
                let row = tile.mask.mask[j];
                for (let i = 0, w=tile.mask.mask[j].length; i < w; i++){
                  if (row[i]>0){
                    let id = rawMask[acc++];
                    if (id>0)
                      masks[id-1].mask[j+tile.y][i+tile.x] = 1;
                  }
                }
              }

            });

            for (let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    //let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                    let color = derivedBuffer.colorScale.colorRange[1]
                    this.image[0].render(color, tile, masks[i]);
                });
            }

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
        else if (this.compose.mix === "propline") {
            for(let tile of this.tiles) {let hatch = Composer.hatch(tile, this.derivedBuffers, tile.dataValues, this.compose.size,
                                           this.compose.widthprop, this.compose.colprop);
                this.image[0].render(hatch, tile.center);
            }
        }
        else if (this.compose.mix === "hatching") {
            let maxCount = util.amax(this.tiles.map(tile => tile.maxValue()));
            this.derivedBuffers.forEach((derivedBuffer:DerivedBuffer, i:number) => {
                // Ugly side effect, should pass dataValues to Composer.hatch instead
                derivedBuffer.angle = Math.PI * i / (2*this.derivedBuffers.length);
            });

            for(let tile of this.tiles) {
                let hatch:HTMLCanvasElement;

                if (typeof this.compose.widthprop === "number")
                  hatch= Composer.hatch(tile, this.derivedBuffers, tile.dataValues, this.compose.size,
                                              this.compose.widthprop*maxCount, this.compose.colprop);
                else
                  hatch = Composer.hatch(tile, this.derivedBuffers, tile.dataValues, this.compose.size,
                                               this.compose.widthprop, this.compose.colprop);

                this.image[0].render(hatch, tile.center);
            }
        }
        else if (this.compose.mix === "glyph") {
            let maxCount = util.amax(this.tiles.map(tile => tile.maxValue()));
            let glyphSpec = this.compose.glyphSpec!;

            let d3scale, d3base = 1;
            if(this.scale instanceof Scale.LinearScale) {
                d3scale = 'linear';
            }
            else if(this.scale instanceof Scale.LogScale) {
                d3scale = 'log';
                d3base = (<Scale.LogScale>this.scale).base;
            }
            else {
                throw 'failed to convert a scale to a d3 scale. Please add a specification';
            }

            this.d3base = d3base;
            this.d3scale = d3scale;

            if(glyphSpec.template === "bars") {
                let width = glyphSpec.width; // tile.mask.width;
                let height = glyphSpec.height; // tile.mask.height;

                for(let tile of this.tiles) {
                    if(tile.mask.width < width
                        || tile.mask.height < height) continue;

                    let promise = Composer.bars(this.derivedBuffers, this.bufferNames || this.labels, tile.dataValues, {
                        width: glyphSpec.width,
                        height: glyphSpec.height,
                        'y.scale.domain': this.scale.domain as [number, number],
                        'y.scale.type': d3scale,
                        'y.scale.base': d3base
                    }).then((vegaCanvas) => {
                        let rect = tile.getRectAtCenter();
                        if(!rect || rect.width() < width || rect.height() < height) return;

                        this.image[0].render(vegaCanvas, rect.center(), {
                            width: width,
                            height: height
                        });
                    })

                    promises.push(promise);
                }
            }
            else if(glyphSpec.template === "punchcard") {
                for(let tile of this.tiles) {
                    let width = glyphSpec.width; // tile.mask.width;
                    let height = glyphSpec.height; // tile.mask.height;

                    // console.log('mask', width, height);

                    let promise = Composer.punchcard(this.derivedBuffers, this.bufferNames || this.labels, tile.dataValues, {
                        width: width,
                        height: height,
                        'z.scale.domain': this.scale.domain as [number, number],
                        'z.scale.type': d3scale,
                        'z.scale.base': d3base,
                        cols: Math.ceil(Math.sqrt(this.derivedBuffers.length)),
                        factor: glyphSpec.factor
                    }).then((vegaCanvas) => {
                        // console.log('canvas', vegaCanvas.width, vegaCanvas.height);
                        let rect = tile.getRectAtCenter();

                        if(!rect || rect.width() < width || rect.height() < height) return;

                        this.image[0].render(vegaCanvas, rect.center(), {
                            width: width,
                            height: height,
                        });
                    })

                    promises.push(promise);
                }
            }
        }
        else
            console.log('No composition');

        let render = () => {
            let options = <any>{};
            if (this.blur != undefined)
                options.blur = this.blur;

            if (this.compose.mix === "time")
                options.interval = this.compose.interval;

            let ctx = CanvasRenderer.renderAll(this.image, id, this.compose.order, options);
            // TODO: adding strokes does not work with time multiplexing

            if (this.contour.stroke > 0) {
                // Assume all the scales are shared between derived buffers
                let path   = d3.geoPath(null, ctx),
                thresholds = this.derivedBuffers[0].thresholds(this.contour.stroke);

                ctx.strokeStyle = 'black';

                let minStretch = Infinity;
                this.derivedBuffers.forEach((derivedBuffer, k) => {
                    let loop0 = derivedBuffer.originalDataBuffer.max();

                    // TODO: check if this is correct
                    // jaemin: the "blur" method is destructive, not returning a new derivedBuffer instance
                    derivedBuffer.originalDataBuffer.blur(this.contour.blur);

                    this.blurredBuffers[k] = derivedBuffer;
                    let loop1 = this.blurredBuffers[k].originalDataBuffer.max();
                    minStretch = Math.min(minStretch, loop0/loop1);
                });

                //let scale = minStretch == 0 ? 0 :  minStretch;
                this.blurredBuffers.forEach((blurredBuffer, k) => {
                    blurredBuffer.originalDataBuffer.rescale(minStretch);
                });

                this.blurredBuffers.forEach((blurredBuffer, k) => {
                    let locthresholds = blurredBuffer.thresholds(this.contour.stroke);
                    let geometries = blurredBuffer.contours(locthresholds, this.contour.blur),
                        colors     = locthresholds.map(v => blurredBuffer.colorScale.colorRange[1]);
                    if (this.contour.colProp)
                      colors = thresholds.map(v => blurredBuffer.colorScale.map(v));

                    geometries.forEach((geo:any,k:number) => {
                        ctx.beginPath();
                        path(geo);
                        ctx.strokeStyle = colors[k].hex();
                        ctx.lineWidth =this.contour.lineWidth;
                        ctx.stroke();
                    });
                });
            }

            this.renderStroke(id);

            if (this.maskStroke)
                for(let tile of this.tiles)
                    CanvasRenderer.strokeVectorMask(tile.mask, id, {color: this.maskStroke});
        };
       if (promises.length > 0) Promise.all(promises).then(render);
       else render();
    }

    renderLegend(id:string) {
        LegendBuilder(id, this);
    }

    renderStroke(id:HTMLCanvasElement | string)
    {
        if(!this.stroke) return;

        let stroke = this.stroke!;

        let url      = stroke.url,
            topojson = stroke.topojson,
            feature  = stroke.feature; //CHECK

        console.log(`topojson stroke url=${url} feature=${feature}`);
        // TODO get the projection, transform, clip, etc.

        if (!topojson.objects[feature] ||
            !topojson.objects[feature].geometries ||
            !Array.isArray(topojson.objects[feature].geometries) ||
            topojson.objects[feature].geometries.length === 0 ){
            console.log("ERROR: no correct array named 'geometries' in the specified feature("+feature+"). Is it really topojson or did you specify wrong feature name?");
        }

        let projection = this.geo.proj4 || this.geo.projection;
        let tiles = Tiling.topojsonTiling(this.width, this.height,
                                    topojson,
                                    topojson.objects[feature],
                                    projection,
                                    this.geo.latitudes, this.geo.longitudes);

        for(let tile of tiles)
            CanvasRenderer.strokeVectorMask(tile.mask, id, {color: stroke.color, lineWidth: stroke.lineWidth});

    }
    pickDomains(x:number, y:number): [number, number]|null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return null;
        return [util.linterp(this.xdomain[0], this.xdomain[1], x/this.width),
                util.linterp(this.ydomain[0], this.ydomain[1], y/this.height)];
    }

    pickValues(x:number, y:number): number[] {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return [];
        return this.dataBuffers.map(dataBuffer => dataBuffer.values[y][x]);
    }

    pickTile(x:number, y:number): Tile|null {
        if (this.tiles.length == 0 ||
            x < 0 || x >= this.width || y < 0 || y >= this.height)
            return null;

        var tile: Tile|null = null;

        if (this.rebin===undefined ||
            this.rebin.type===undefined ||
            this.rebin.type=="none") {
            tile = this.tiles[this.width*y + x];
        }
        else if (this.rebin.type == "square") {
            let size = this.rebin.size || 10;
            x = Math.floor(x/size);
            y = Math.floor(y/size);
            tile = this.tiles[Math.floor(this.width/size)*y + x];
        }
        else if (this.rebin.type == "rect") {
            let width = this.rebin.width || 10,
                height = this.rebin.height || 10;
            x = Math.floor(x/width);
            y = Math.floor(y/height);
            tile = this.tiles[Math.floor(this.width/width)*y + x];
        }
        else {
            for (let t of this.tiles)
                if (t.contains(x,y)) {
                    tile = t;
                    break;
                }
        }
        return tile;
    }
}


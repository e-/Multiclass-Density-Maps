"use strict";
// Interpreter from a parsed specification
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Configuration = __importStar(require("./configuration"));
const derived_buffer_1 = __importDefault(require("./derived-buffer"));
const canvas_renderer_1 = __importDefault(require("./canvas-renderer"));
const image_1 = __importDefault(require("./image"));
const Tiling = __importStar(require("./tiling"));
const tile_1 = require("./tile");
const color_1 = __importDefault(require("./color"));
const composer_1 = __importDefault(require("./composer"));
const Scale = __importStar(require("./scale"));
const util = __importStar(require("./util"));
const mask_1 = __importDefault(require("./mask"));
const Weaving = __importStar(require("./weaving"));
const legend_1 = __importDefault(require("./legend"));
const d3g = __importStar(require("d3-geo"));
const d3s = __importStar(require("d3-selection"));
const d3sc = __importStar(require("d3-scale"));
const d3a = __importStar(require("d3-axis"));
const util_1 = require("./util");
class Interpreter {
    constructor(configuration, debug = false) {
        this.configuration = configuration;
        this.debug = debug;
        this.n = 0;
        this.sourceBuffers = [];
        this.dataBuffers = [];
        this.derivedBuffers = [];
        this.blurredBuffers = [];
        this.image = [];
        this.tiles = [];
        this.tileAggregation = tile_1.TileAggregation.Mean;
        this.strokeCanvas = false;
        this.backgroundStroke = "grey";
        this.fillCanvas = true;
        this.colors0 = color_1.default.Category10t;
        this.colors1 = color_1.default.Category10;
        this.composer = composer_1.default.none;
        this.masks = [];
        this.blur = 0;
        this.scale = new Scale.LinearScale([0, 1], [0, 1]);
        // d3 name of scale, used for legend
        this.d3scale = "linear";
        this.d3base = 10;
        this.d3exponent = Math.E;
        if (!configuration.validate())
            throw "Invalid configuration";
        this.description = configuration.description;
        this.width = configuration.width;
        this.height = configuration.height;
        if (configuration.background)
            this.background = configuration.background;
        this.bufferNames = configuration.bufferNames;
        this.n = this.bufferNames.length;
        this.sourceBuffers = configuration.getBuffers();
        this.dataBuffers = this.sourceBuffers;
        this.dataSpec = configuration.data.dataSpec;
        let colormap0 = configuration.getColors0();
        if (colormap0.length >= this.bufferNames.length)
            this.colors0 = colormap0.map((name) => color_1.default.get(name));
        else if (colormap0.length != 0) {
            this.warn('Not enough colors(0) in colormap, ignored');
        }
        else if (configuration.compose && configuration.compose.mix == 'blend' && configuration.compose.mixing == 'multiplicative') {
            this.colors0 = this.bufferNames.map(d => color_1.default.White);
        }
        let colormap1 = configuration.getColors1();
        if (colormap1.length >= this.bufferNames.length)
            this.colors1 = colormap1.map((name) => color_1.default.get(name));
        else if (colormap1.length != 0) {
            this.warn('Not enough colors(1) in colormap, ignored');
        }
        this.rebin = configuration.rebin;
        if (configuration.compose === undefined)
            this.compose = new Configuration.ComposeSpec();
        else
            this.compose = configuration.compose;
        if (configuration.rescale)
            this.rescale = configuration.rescale;
        else
            this.rescale = new Configuration.RescaleSpec();
        if (configuration.blur)
            this.blur = configuration.blur;
        if (configuration.contour === undefined)
            this.contour = new Configuration.ContourSpec();
        else
            this.contour = configuration.contour;
        this.stroke = configuration.stroke;
        this.axis = configuration.axis;
        this.geo = configuration.getGeo();
        this.legend = configuration.legend;
        this.xdomain = configuration.getXDomain();
        this.ydomain = configuration.getYDomain();
    }
    log(...args) {
        if (this.debug)
            console.log.apply(console, args);
    }
    warn(...args) {
        if (this.debug)
            console.warn.apply(console, args);
    }
    error(...args) {
        if (this.debug)
            console.error.apply(console, args);
    }
    interpret(context = {}) {
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
            let equidepth = new Scale.EquiDepthScale([0, maxCount], [0, 1], this.rescale.levels);
            for (let tile of this.tiles)
                equidepth.addPoints(tile.dataValues);
            equidepth.computeBounds();
            this.scale = equidepth;
        }
        else {
            throw `undefined rescale type: ${this.rescale.type}`;
        }
        this.derivedBuffers = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new derived_buffer_1.default(dataBuffer);
            derivedBuffer.colorScale = new Scale.ColorScale([this.colors0[i], this.colors1[i]], this.scale);
            derivedBuffer.color = this.colors1[i];
            if (this.masks.length > i)
                derivedBuffer.mask = this.masks[i];
            return derivedBuffer;
        });
    }
    computeDerivedBuffers(context = {}) {
        if (this.blur > 0) {
            let newbuffers = this.dataBuffers.map(dataBuffer => dataBuffer.blur(this.blur));
            this.dataBuffers = newbuffers;
        }
    }
    computeRebin(context = {}) {
        var tiles = this.tiles;
        if (this.rebin) {
            if (this.rebin.aggregation === "max") {
                this.tileAggregation = tile_1.TileAggregation.Max;
            }
            else if (this.rebin.aggregation === "min") {
                this.tileAggregation = tile_1.TileAggregation.Min;
            }
            else if (this.rebin.aggregation === "mean") {
                this.tileAggregation = tile_1.TileAggregation.Mean;
            }
            else if (this.rebin.aggregation === "sum") {
                this.tileAggregation = tile_1.TileAggregation.Sum;
            }
        }
        if (this.rebin === undefined ||
            this.rebin.type === undefined ||
            this.rebin.type == "none") {
            this.log('  Pixel rebin');
            tiles = Tiling.pixelTiling(this.width, this.height);
        }
        else if (this.rebin.type == "square") {
            let size = this.rebin.size || 10;
            this.log('  Square rebin size=' + size);
            tiles = Tiling.rectangularTiling(this.width, this.height, size, size);
        }
        else if (this.rebin.type == "rect") {
            let width = this.rebin.width || 10, height = this.rebin.height || 10;
            this.log('  Square rebin w=' + width + ' h=' + height);
            tiles = Tiling.rectangularTiling(this.width, this.height, width, height);
        }
        else if (this.rebin.type == "topojson") {
            let url = this.rebin.url, topojson = this.rebin.topojson, feature = this.rebin.feature || null; //CHECK
            this.log('  topojson rebin url=' + url
                + ' feature=' + feature);
            // TODO get the projection, transform, clip, etc.
            if (!topojson.objects[feature] ||
                !topojson.objects[feature].geometries ||
                !Array.isArray(topojson.objects[feature].geometries) ||
                topojson.objects[feature].geometries.length == 0) {
                throw new Error("no correct array named 'geometries' in the specified feature(" + feature + "). Is it really topojson or did you specify wrong feature name?");
            }
            //[jdf] for now, ignore min/maxfeature
            // remove unnecessary features like far islands ...
            // if (this.rebin.maxfeature != undefined && this.rebin.maxfeature > 0)
            //   topojson.objects[feature].geometries.splice(this.rebin.maxfeature,
            //                                               topojson.objects[feature].geometries.length-this.rebin.maxfeature);
            // if (this.rebin.minfeature != undefined && this.rebin.minfeature>0)
            //   topojson.objects[feature].geometries.splice(0, this.rebin.minfeature);
            let projection = this.geo.proj4 || this.geo.projection;
            tiles = Tiling.topojsonTiling(this.width, this.height, topojson, topojson.objects[feature], projection, this.geo.latitudes, this.geo.longitudes, this.rebin.minfeature == -1);
        }
        else if (this.rebin.type == "voronoi") {
            if (this.rebin.points) {
                let points = this.rebin.points;
                this.log('  voronoi rebin sites=' + points);
                tiles = Tiling.voronoiTiling(this.width, this.height, 0, points);
            }
            else {
                let sites = this.rebin.size || 10;
                tiles = Tiling.voronoiTiling(this.width, this.height, sites);
            }
        }
        else if (this.rebin.type == "hexa") {
            let size = this.rebin.size || 10;
            let points = [];
            for (let j = 0; j < this.height; j += size / Math.sqrt(2))
                for (let i = ((j / (size / Math.sqrt(2))) % 2) * (size / 2); i < this.width + size; i += size)
                    points.push([i, j]);
            tiles = Tiling.voronoiTiling(this.width, this.height, 0, points);
        }
        if (this.rebin != undefined && this.rebin.stroke)
            this.maskStroke = this.rebin.stroke;
        this.tiles = tiles;
    }
    computeCompose(context = {}) {
        if (this.compose.mix === "max")
            this.composer = composer_1.default.max;
        else if (this.compose.mix === "mean")
            this.composer = composer_1.default.mean;
        else if (this.compose.mix === "invmin")
            this.composer = composer_1.default.invmin;
        else if (this.compose.mix === "blend") {
            if (this.compose.mixing === "multiplicative")
                this.composer = composer_1.default.multiplicativeMix;
            else
                this.composer = composer_1.default.additiveMix;
        }
        else if (this.compose.mix === "weaving" && this.compose.shape == "random")
            this.masks = Weaving.randomMasks(this.n, this.compose.size, this.width, this.height);
        else if (this.compose.mix === "weaving" && this.compose.shape == "square")
            this.masks = Weaving.squareMasks(this.n, this.compose.size, this.width, this.height);
        else if (this.compose.mix === "weaving" && this.compose.shape == "hex")
            this.masks = Weaving.hexMasks(this.n, this.compose.size, this.width, this.height);
        else if (this.compose.mix === "weaving" && this.compose.shape == "tri")
            this.masks = Weaving.triangleMasks(this.n, this.compose.size, this.width, this.height);
    }
    setup(canvas, width, height) {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (this.background)
            canvas.style.backgroundColor = this.background;
        if (this.description)
            canvas.setAttribute("title", this.description);
    }
    renderMap(canvas, wrapper, width, height) {
        let promises = [];
        if (this.compose.mix === "separate") { // small multiples
            this.image = this.derivedBuffers.map((b) => new image_1.default(this.width, this.height));
            for (let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = composer_1.default.one(derivedBuffer, tile.dataValues[i]);
                    this.image[i].render(color, tile);
                });
            }
        }
        else if (this.compose.mix === "time") { // time multiplexing
            this.image = this.derivedBuffers.map((b) => new image_1.default(this.width, this.height));
            for (let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    let color = composer_1.default.one(derivedBuffer, tile.dataValues[i]);
                    this.image[i].render(color, tile);
                });
            }
        }
        else {
            this.image = [new image_1.default(this.width, this.height)];
        }
        // Need the tiles to compute dot density plots
        if (this.compose.mix === "dotdensity") {
            let size = this.compose.size;
            // create one mask per databuffer
            let masks = this.derivedBuffers
                .map((buffer) => new mask_1.default(this.width, this.height, 0));
            let areas = this.tiles.map(tile => tile.pixcount(size));
            let biggest = util.amax(areas);
            let densities = this.tiles.map((tile, i) => {
                let area = areas[i];
                return area == 0 ? 0 : tile.sumValue() / (area - 1);
            });
            let maxDensity = util.amax(densities);
            let rawMask = new Uint8Array(biggest); // max of 253 data buffers
            this.tiles.forEach(function (tile, k) {
                // create a local mask to store all the values together before dispatching
                // them in every mask for every databuffer.
                //let buffer = new ArrayBuffer(tile.mask.width*tile.mask.height);
                //let mask = Array<Uint8ClampedArray>(tile.mask.height);
                //for (let j = 0; j < tile.mask.height; j++) {
                //    mask[j] = new Uint8ClampedArray(buffer, j*tile.mask.width, tile.mask.width);
                //    mask[j].set(tile.mask.mask[j]);
                //}
                // proportion and suming
                let acc = 0;
                let pixCounts = tile.dataValues.map((v) => { acc += v / maxDensity; return acc; });
                // for every buffer we want to distribute a given number of points in its mask.
                // to do so, we create a buffer of values to distriibute among the buffer masks.
                // values 1+2 will fall where the mask of buffer#1 should display something.
                // values 2+2 will fall where the mask of buffer#2 should display something, etc.
                // values 0 and 1 already lies in the masks and mean the mask is filled or not.
                // in the end mask can only display something where there was a 1 before.
                let prev = 0;
                pixCounts.forEach((pc, j) => {
                    rawMask.fill(j + 1, prev, Math.floor(pc)); // was round??
                    prev = Math.floor(pc);
                });
                // finish with special values that will fall in no buffer in the end
                rawMask.fill(0, prev, areas[k]);
                // shuffle
                for (let i = areas[k] - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [rawMask[i], rawMask[j]] = [rawMask[j], rawMask[i]];
                }
                // dispatch the values in the straight array toward the masks (only where there are 1 in the tile's mask)
                acc = 0;
                for (let j = 0; j < tile.mask.mask.length; j += size) {
                    let row = tile.mask.mask[j];
                    for (let i = 0, w = tile.mask.mask[j].length; i < w; i += size) {
                        if (row[i] > 0) {
                            let id = rawMask[acc++];
                            if (id > 0)
                                for (let dj = 0; dj < size && j + dj + tile.y < masks[id - 1].mask.length; dj++)
                                    masks[id - 1].mask[j + dj + tile.y].fill(1, i + tile.x, i + tile.x + size);
                        }
                    }
                }
            });
            for (let tile of this.tiles) {
                this.derivedBuffers.forEach((derivedBuffer, i) => {
                    //let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                    let color = derivedBuffer.colorScale.colorRange[1];
                    this.image[0].render(color, tile, masks[i]);
                });
            }
        }
        if (this.composer == composer_1.default.invmin) {
            for (let tile of this.tiles) {
                let color = composer_1.default.invmin(this.derivedBuffers, tile.dataValues, this.compose.threshold);
                this.image[0].render(color, tile);
            }
        }
        else if (this.composer != composer_1.default.none) {
            for (let tile of this.tiles) {
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
            for (let tile of this.tiles) {
                let hatch = composer_1.default.hatch(tile, this.derivedBuffers, tile.dataValues, {
                    thickness: this.compose.size,
                    sort: this.compose.sort,
                    widthprop: this.compose.widthprop,
                    colprop: this.compose.colprop
                });
                this.image[0].render(hatch, tile.center);
            }
        }
        else if (this.compose.mix === "hatching") {
            let maxCount = util.amax(this.tiles.map(tile => tile.maxValue()));
            this.derivedBuffers.forEach((derivedBuffer, i) => {
                // Ugly side effect, should pass dataValues to Composer.hatch instead
                derivedBuffer.angle = Math.PI * i / (2 * this.derivedBuffers.length);
            });
            for (let tile of this.tiles) {
                let hatch;
                if (typeof this.compose.widthprop === "number")
                    hatch = composer_1.default.hatch(tile, this.derivedBuffers, tile.dataValues, {
                        thickness: this.compose.size,
                        sort: this.compose.sort,
                        widthprop: this.compose.widthprop * maxCount,
                        colprop: this.compose.colprop
                    });
                else
                    hatch = composer_1.default.hatch(tile, this.derivedBuffers, tile.dataValues, {
                        thickness: this.compose.size,
                        sort: this.compose.sort,
                        widthprop: this.compose.widthprop,
                        colprop: this.compose.colprop
                    });
                this.image[0].render(hatch, tile.center);
            }
        }
        else if (this.compose.mix === "glyph") {
            let maxCount = util.amax(this.tiles.map(tile => tile.maxValue()));
            let glyphSpec = this.compose.glyphSpec;
            let d3scale, d3base = 1, d3exponent = Math.E;
            if (this.scale instanceof Scale.LinearScale) {
                d3scale = 'linear';
            }
            else if (this.scale instanceof Scale.LogScale) {
                d3scale = 'log';
                d3base = this.scale.base;
            }
            else if (this.scale instanceof Scale.RootScale) {
                d3scale = 'pow';
                d3exponent = 1 / this.scale.degree;
            }
            else {
                throw 'failed to convert a scale to a d3 scale. Please add a specification';
            }
            this.d3base = d3base;
            this.d3scale = d3scale;
            this.d3exponent = d3exponent;
            if (glyphSpec.template === "bars") {
                let width = glyphSpec.width; // tile.mask.width;
                let height = glyphSpec.height; // tile.mask.height;
                for (let tile of this.tiles) {
                    if (tile.mask.width < width
                        || tile.mask.height < height)
                        continue;
                    let promise = composer_1.default.bars(this.derivedBuffers, this.bufferNames, tile.dataValues, {
                        width: glyphSpec.width,
                        height: glyphSpec.height,
                        'y.scale.domain': this.scale.domain,
                        'y.scale.type': d3scale,
                        'y.scale.base': d3base,
                        'y.scale.exponent': d3exponent
                    }).then((vegaCanvas) => {
                        let rect = tile.getRectAtCenter();
                        if (!rect || rect.width() < width || rect.height() < height)
                            return;
                        this.image[0].render(vegaCanvas, rect.center(), {
                            width: width,
                            height: height
                        });
                    });
                    promises.push(promise);
                }
            }
            else if (glyphSpec.template === "punchcard") {
                for (let tile of this.tiles) {
                    let width = glyphSpec.width; // tile.mask.width;
                    let height = glyphSpec.height; // tile.mask.height;
                    // this.log('mask', width, height);
                    let promise = composer_1.default.punchcard(this.derivedBuffers, this.bufferNames, tile.dataValues, {
                        width: width,
                        height: height,
                        'z.scale.domain': this.scale.domain,
                        'z.scale.type': d3scale,
                        'z.scale.base': d3base,
                        cols: Math.ceil(Math.sqrt(this.derivedBuffers.length)),
                        factor: glyphSpec.factor
                    }).then((vegaCanvas) => {
                        // this.log('canvas', vegaCanvas.width, vegaCanvas.height);
                        let rect = tile.getRectAtCenter();
                        if (!rect || rect.width() < width || rect.height() < height)
                            return;
                        this.image[0].render(vegaCanvas, rect.center(), {
                            width: width,
                            height: height,
                        });
                    });
                    promises.push(promise);
                }
            }
        }
        else
            this.log('No composition');
        let render = () => {
            let options = {};
            if (this.blur != undefined)
                options.blur = this.blur;
            if (this.compose.mix === "time") {
                options.interval = this.compose.interval;
                options.wrapper = wrapper;
            }
            let ctx = canvas_renderer_1.default.renderAll(this.image, canvas, width, height, this.compose.order, options);
            // TODO: adding strokes does not work with time multiplexing
            if (this.contour.stroke > 0) {
                // Assume all the scales are shared between derived buffers
                let path = d3g.geoPath(null, ctx), thresholds = this.derivedBuffers[0].thresholds(this.contour.stroke);
                ctx.strokeStyle = 'black';
                let minStretch = Infinity;
                this.derivedBuffers.forEach((derivedBuffer, k) => {
                    let loop0 = derivedBuffer.originalDataBuffer.max();
                    let blurred = derivedBuffer.originalDataBuffer.blur(this.contour.blur);
                    // TODO jaemin will improve
                    derivedBuffer.originalDataBuffer = blurred;
                    this.blurredBuffers[k] = derivedBuffer;
                    let loop1 = this.blurredBuffers[k].originalDataBuffer.max();
                    minStretch = Math.min(minStretch, loop0 / loop1);
                });
                this.blurredBuffers.forEach((blurredBuffer, k) => {
                    blurredBuffer.originalDataBuffer.rescale(minStretch);
                });
                this.blurredBuffers.forEach((blurredBuffer, k) => {
                    let locthresholds = blurredBuffer.thresholds(this.contour.stroke);
                    let geometries = blurredBuffer.contours(locthresholds, this.contour.blur), colors = locthresholds.map(v => blurredBuffer.colorScale.colorRange[1]);
                    if (this.contour.colprop)
                        colors = thresholds.map(v => blurredBuffer.colorScale.map(v));
                    geometries.forEach((geo, k) => {
                        ctx.beginPath();
                        path(geo);
                        ctx.strokeStyle = colors[k].css();
                        ctx.lineWidth = this.contour.lineWidth;
                        ctx.stroke();
                    });
                });
            }
            if (this.maskStroke)
                for (let tile of this.tiles)
                    canvas_renderer_1.default.strokeVectorMask(tile.mask, canvas, { color: this.maskStroke });
        };
        if (promises.length > 0)
            Promise.all(promises).then(render);
        else
            render();
    }
    render(id, forcedWidth, forcedHeight) {
        let wrapper;
        if (typeof id === "string")
            wrapper = document.getElementById(id);
        else
            wrapper = id;
        let mapCanvas = document.createElement("canvas"), axisSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let width = forcedWidth || this.width;
        let height = forcedHeight || this.height;
        axisSVG.style.verticalAlign = "top";
        mapCanvas.style.verticalAlign = "top";
        if (this.axis) {
            let pack = document.createElement("div");
            pack.style.display = "inline-block";
            pack.style.position = "relative";
            pack.appendChild(axisSVG);
            pack.appendChild(mapCanvas);
            pack.style.verticalAlign = "top";
            wrapper.appendChild(pack);
        }
        else {
            wrapper.appendChild(mapCanvas);
        }
        this.setup(mapCanvas, width, height);
        this.renderMap(mapCanvas, wrapper, width, height);
        if (this.legend !== false) {
            let legend = document.createElement("div");
            legend.style.display = "inline-block";
            legend.style.position = "relative";
            wrapper.appendChild(legend);
            legend_1.default(legend, this);
        }
        if (this.axis) {
            this.renderAxis(mapCanvas, axisSVG, forcedWidth, forcedHeight);
        }
        if (this.stroke)
            this.renderStroke(mapCanvas);
    }
    renderAxis(map, native, forcedWidth, forcedHeight) {
        let svg = d3s.select(native);
        let margin = {
            left: this.axis.marginLeft,
            bottom: this.axis.marginBottom,
            right: this.axis.marginRight,
            top: this.axis.marginTop
        };
        map.style.position = "absolute";
        map.style.left = margin.left + "px";
        map.style.top = margin.top + "px";
        let width = forcedWidth || this.width;
        let height = forcedHeight || this.height;
        svg
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);
        let xAxisG = svg.append('g').attr('transform', util_1.translate(margin.left, margin.top + height));
        let x = d3sc.scaleLinear().domain(this.xdomain).range([0, width]);
        xAxisG.call(d3a.axisBottom(x));
        let yAxisG = svg.append('g').attr('transform', util_1.translate(margin.left, margin.top));
        let y = d3sc.scaleLinear().domain(this.ydomain).range([0, height]);
        yAxisG.call(d3a.axisLeft(y));
        let xTitle = this.dataSpec.encoding.x.field;
        let yTitle = this.dataSpec.encoding.y.field;
        if (this.axis.x && this.axis.x.title)
            xTitle = this.axis.x.title;
        if (this.axis.y && this.axis.y.title)
            yTitle = this.axis.y.title;
        svg.append('text')
            .attr('transform', util_1.translate(width / 2 + margin.left, margin.top + height + margin.bottom))
            .style('font-size', '11px')
            .style('font-family', 'sans-serif')
            .attr('text-anchor', 'middle')
            .attr('dy', '-.5em')
            .style('font-weight', 'bold')
            .text(xTitle);
        svg.append('text')
            .attr("transform", util_1.translate(0, margin.top + height / 2) + "rotate(-90)")
            .attr("dy", ".71em")
            .attr("y", "3px")
            .style('font-size', '11px')
            .style('font-family', 'sans-serif')
            .style("text-anchor", "middle")
            .style('font-weight', 'bold')
            .text(yTitle);
    }
    renderStroke(canvas) {
        let stroke = this.stroke;
        let url = stroke.url, topojson = stroke.topojson, feature = stroke.feature; //CHECK
        this.log(`topojson stroke url=${url} feature=${feature}`);
        // TODO get the projection, transform, clip, etc.
        if (!topojson.objects[feature] ||
            !topojson.objects[feature].geometries ||
            !Array.isArray(topojson.objects[feature].geometries) ||
            topojson.objects[feature].geometries.length === 0) {
            throw new Error("no correct array named 'geometries' in the specified feature(" + feature + "). Is it really topojson or did you specify wrong feature name?");
        }
        let projection = this.geo.proj4 || this.geo.projection;
        let tiles = Tiling.topojsonTiling(this.width, this.height, topojson, topojson.objects[feature], projection, this.geo.latitudes, this.geo.longitudes);
        for (let tile of tiles)
            canvas_renderer_1.default.strokeVectorMask(tile.mask, canvas, { color: stroke.color, lineWidth: stroke.lineWidth });
    }
    pickDomains(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return null;
        return [util.linterp(this.xdomain[0], this.xdomain[1], x / this.width),
            util.linterp(this.ydomain[0], this.ydomain[1], y / this.height)];
    }
    pickValues(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return [];
        return this.dataBuffers.map(dataBuffer => dataBuffer.values[y][x]);
    }
    pickTile(x, y) {
        if (this.tiles.length == 0 ||
            x < 0 || x >= this.width || y < 0 || y >= this.height)
            return null;
        var tile = null;
        if (this.rebin === undefined ||
            this.rebin.type === undefined ||
            this.rebin.type == "none") {
            tile = this.tiles[this.width * y + x];
        }
        else if (this.rebin.type == "square") {
            let size = this.rebin.size || 10;
            x = Math.floor(x / size);
            y = Math.floor(y / size);
            tile = this.tiles[Math.floor(this.width / size) * y + x];
        }
        else if (this.rebin.type == "rect") {
            let width = this.rebin.width || 10, height = this.rebin.height || 10;
            x = Math.floor(x / width);
            y = Math.floor(y / height);
            tile = this.tiles[Math.floor(this.width / width) * y + x];
        }
        else {
            for (let t of this.tiles)
                if (t.contains(x, y)) {
                    tile = t;
                    break;
                }
        }
        return tile;
    }
}
exports.default = Interpreter;
//# sourceMappingURL=interp.js.map
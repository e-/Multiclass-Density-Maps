"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tile_1 = __importDefault(require("./tile"));
const mask_1 = __importDefault(require("./mask"));
const d3v = __importStar(require("d3-voronoi"));
const d3g = __importStar(require("d3-geo"));
const topo = __importStar(require("topojson-client"));
const rn = __importStar(require("random-seed"));
const proj4_1 = __importDefault(require("proj4"));
const util_1 = require("./util");
function pixelTiling(width, height) {
    let tiles = [];
    let buffer = new ArrayBuffer(width * height);
    new Uint8ClampedArray(buffer).fill(1);
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            tiles.push(new tile_1.default(col, row, new mask_1.default(1, 1, undefined, buffer, row * width + col)));
        }
    }
    return tiles;
}
exports.pixelTiling = pixelTiling;
function topojsonTiling(width, height, wholetopojson, feature, projectionName = "Mercator", latitudes, longitudes, debug = false) {
    let tiles = [];
    let proj = d3g.geoEquirectangular();
    if (projectionName == "Equirectangular") { } // pass
    else if (projectionName == "epsg:3857" || projectionName == "Mercator")
        proj = d3g.geoMercator();
    else {
        //console.log('Searching for projection ' + projectionName);
        let p4 = proj4_1.default(projectionName);
        function project(lambda, phi) {
            return p4.forward([lambda, phi].map(util_1.rad2deg));
        }
        // project.invert = (x:number, y:number) =>
        //      p4.inverse([x, y]).map(degreesToRadians);
        proj = d3g.geoProjection(project);
    }
    let allfeatures = topo.feature(wholetopojson, feature);
    let projection = Object.create(proj).fitSize([width, height], allfeatures);
    var clipped = 0;
    //if (debug) console.log("debug");
    let bbox = topo.bbox(wholetopojson);
    //if (debug) console.log("  " + bbox);
    // The fitSize has to happen after the fitExtent
    if (latitudes != undefined && longitudes != undefined) {
        let bounds = [latitudes[0], longitudes[0], latitudes[1], longitudes[1]];
        //if (debug) console.log("  bounds:" + bounds);
        let simple_feature = {
            "type": "GeometryCollection",
            "geometries": [{ "type": "Point", "coordinates": [latitudes[0], longitudes[0]] },
                { "type": "Point", "coordinates": [latitudes[0], longitudes[1]] },
                { "type": "Point", "coordinates": [latitudes[1], longitudes[1]] },
                { "type": "Point", "coordinates": [latitudes[1], longitudes[0]] }]
        };
        projection.fitSize([width, height], simple_feature);
    }
    else
        projection.fitSize([width, height], allfeatures);
    let gp = d3g.geoPath(projection);
    // mainland states
    for (let j = 0; j < feature.geometries.length; j++) {
        // just one shape
        let onefeature = topo.feature(wholetopojson, feature.geometries[j]);
        let bb = gp.bounds(onefeature);
        var xmin = bb[0][0], ymin = bb[0][1], xmax = bb[1][0], ymax = bb[1][1];
        // clip invisible features
        if (xmin >= width || ymin >= height || xmax <= 0 || ymax <= 0) {
            clipped++;
            //if (debug) console.log('  cliping feature ' + onefeature.id + ' bbox:' + bb);
            continue;
        }
        // clipped area
        xmin = Math.max(0, xmin);
        xmax = Math.min(width, xmax);
        ymin = Math.max(0, ymin);
        ymax = Math.min(height, ymax);
        // now let's create a mask for that shape
        let mask = new mask_1.default(Math.ceil(xmax) - Math.floor(xmin), Math.ceil(ymax) - Math.floor(ymin), 0);
        let canvas1 = mask.getCanvas();
        let context1 = canvas1.getContext("2d");
        if (context1 == null) {
            //console.log('Cannot create context for new mask');
            continue;
        }
        let mpath = mask.getPath();
        let path = gp.context(mpath);
        path(onefeature);
        // now render the shape (black opaque over black transparent)
        context1.clearRect(0, 0, canvas1.width, canvas1.height);
        context1.fillStyle = "#111";
        context1.translate(-xmin, -ymin);
        mpath.send(context1);
        context1.fill();
        mask.copyFrom(context1);
        // now with a correct mask we can create the tile
        let tile = new tile_1.default(Math.floor(xmin), Math.floor(ymin), mask);
        tiles.push(tile);
    }
    // if (clipped)
    //     console.log('clipped ' + clipped + ' features');
    return tiles;
}
exports.topojsonTiling = topojsonTiling;
function voronoiTiling(width, height, nbsites = 10, sites = []) {
    let rand3 = rn.create('JaeminFredPierreJean-Daniel');
    if (sites.length == 0) {
        for (var i = 0; i < nbsites; i++) {
            let x = rand3(width);
            let y = rand3(height);
            sites.push([x, y]);
        }
    }
    let tiles = [];
    let voronoi = d3v.voronoi().extent([[0, 0], [width, height]]);
    let polys = voronoi.polygons(sites);
    for (let p in polys) {
        let minx = width;
        let maxx = 0;
        let miny = height;
        let maxy = 0;
        let ptsx = [];
        let ptsy = [];
        for (let k = 0; k < polys[p].length; k++) {
            let x = Math.min(width, Math.max(0, polys[p][k][0]));
            let y = Math.min(height, Math.max(0, polys[p][k][1]));
            ptsx.push(x);
            ptsy.push(y);
            minx = Math.min(minx, x);
            maxx = Math.max(maxx, x);
            miny = Math.min(miny, y);
            maxy = Math.max(maxy, y);
        }
        let mask = new mask_1.default(Math.ceil(maxx - minx) + 1, Math.ceil(maxy - miny) + 1, 0);
        let canvas1 = mask.getCanvas();
        let context1 = canvas1.getContext("2d");
        let path = mask.getPath();
        context1.clearRect(0, 0, canvas1.width, canvas1.height);
        context1.fillStyle = "#111";
        //context1.beginPath();
        path.moveTo(polys[p][0][0], polys[p][0][1]);
        for (let k = 1; k < polys[p].length; k++) {
            let x = Math.min(width, Math.max(0, polys[p][k][0]));
            let y = Math.min(height, Math.max(0, polys[p][k][1]));
            path.lineTo(x, y);
        }
        path.lineTo(polys[p][0][0], polys[p][0][1]);
        context1.translate(-minx, -miny);
        path.send(context1);
        context1.fill();
        mask.copyFrom(context1);
        //let cx = ptsx.reduce((a, b) => a + b, 0) / ptsx.length;
        //let cy = ptsy.reduce((a, b) => a + b, 0) / ptsy.length;
        tiles.push(new tile_1.default(Math.floor(minx), Math.floor(miny), mask));
    }
    return tiles;
}
exports.voronoiTiling = voronoiTiling;
function rectangularTiling(width, height, tileWidth, tileHeight) {
    let rows = Math.ceil(height / tileHeight);
    let cols = Math.ceil(width / tileWidth);
    let tiles = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let mask = new mask_1.default(tileWidth, tileHeight);
            let canvas = mask.getCanvas();
            canvas.width = tileWidth;
            canvas.height = tileHeight;
            let ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.rect(0, 0, tileWidth, tileHeight);
            ctx.fillStyle = "red";
            ctx.fill();
            mask.copyFrom(ctx);
            tiles.push(new tile_1.default(col * tileWidth, row * tileHeight, mask));
        }
    }
    return tiles;
}
exports.rectangularTiling = rectangularTiling;
//# sourceMappingURL=tiling.js.map
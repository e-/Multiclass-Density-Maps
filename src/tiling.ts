import Tile from './tile';
import Mask from './mask';
import * as GeoJSON from 'geojson';
import * as d3 from 'd3';
import * as D3Geo from 'd3-geo';
import * as util from './util';
import * as topo from 'topojson';
import * as rn from 'random-seed';
import proj4 from 'proj4';
import Point from './point';

export function pixelTiling (width:number, height:number) {
  let tiles:Tile[] = [];
  for(let row = 0; row < height; row++) {
    for(let col = 0; col < width; col++) {
      tiles.push(new Tile(col, row, new Mask(1, 1)));
    }
  }

  return tiles;
}

function degreesToRadians(degrees:number) { return degrees * Math.PI / 180; }
function radiansToDegrees(radians:number) { return radians * 180 / Math.PI; }

export function topojsonTiling(width:number, height:number,
                               wholetopojson:any,
                               feature:any,
                               projectionName:string="Mercator",
                               latitudes?:[number,number],
                               longitudes?:[number,number],
                               debug:boolean=false):Tile[] {
  let tiles:Tile[] = [];

  let proj = d3.geoEquirectangular();
  if (projectionName == "Equirectangular"){} // pass
  else if (projectionName=="epsg:3857" || projectionName=="Mercator")
    proj = d3.geoMercator();
  else {
    console.log('Searching for projection '+projectionName);
    let p4 = proj4(projectionName);
    function project(lambda:number, phi:number) {
      return p4.forward([lambda, phi].map(radiansToDegrees));
    }

    // project.invert = (x:number, y:number) =>
    //      p4.inverse([x, y]).map(degreesToRadians);

    proj = d3.geoProjection(<any>project);
  }

  let allfeatures:any = topo.feature(wholetopojson, feature);
  let projection      = Object.create(proj).fitSize([width, height], allfeatures);

  var clipped = 0;
  if (debug) console.log("debug");

  let bbox = topo.bbox(wholetopojson);
  if (debug) console.log("  "+bbox);
  // The fitSize has to happen after the fitExtent
  if (latitudes != undefined && longitudes != undefined) {
    let bounds = [latitudes[0], longitudes[0], latitudes[1], longitudes[1]];
    if (debug) console.log("  bounds:"+bounds);
    let simple_feature:any = {
      "type":"GeometryCollection",
      "geometries": [{"type": "Point", "coordinates": [latitudes[0], longitudes[0]]},
                     {"type": "Point", "coordinates": [latitudes[0], longitudes[1]]},
                     {"type": "Point", "coordinates": [latitudes[1], longitudes[1]]},
                     {"type": "Point", "coordinates": [latitudes[1], longitudes[0]]}]
    };
    projection.fitSize([width, height], simple_feature);
  }
  else
    projection.fitSize([width, height], allfeatures);
  let gp              = d3.geoPath(projection);

  // mainland states
  for (let j=0; j<feature.geometries.length; j++){
    // just one shape

    let onefeature:any = topo.feature(wholetopojson, feature.geometries[j]);
    let bb             = gp.bounds(onefeature);
    var xmin = bb[0][0], ymin = bb[0][1], xmax = bb[1][0], ymax = bb[1][1];

    // clip invisible features
    if (xmin >= width || ymin >= height || xmax <= 0 || ymax <= 0) {
      clipped++;
      if (debug) console.log('  cliping feature '+onefeature.id+' bbox:'+bb);
      continue;
    }
    // clipped area
    xmin = Math.max(0, xmin);
    xmax = Math.min(width, xmax);
    ymin = Math.max(0, ymin);
    ymax = Math.min(height, ymax);

    // now let's create a mask for that shape
    let mask:Mask    = new Mask(Math.ceil(xmax)-Math.floor(xmin),
                                Math.ceil(ymax)-Math.floor(ymin),
                                0);
    let canvas1      = mask.getCanvas();
    let context1 = canvas1.getContext("2d"); // CanvasRenderingContext2D | null
    if (context1 == null) {
      console.log('Cannot create context for new mask');
      continue;
    }

    let path         = gp.context(context1);

    // now render the shape (black opaque over black transparent)
    context1.clearRect(0, 0, canvas1.width, canvas1.height);
    context1.fillStyle="rgba(0, 0, 0, 1.0)";
    context1.translate(-xmin, -ymin);
    path(onefeature);
    context1.fill();

    // let's get an array of pixels from the result drawing
    let pixels = context1!.getImageData(0, 0, canvas1.width, canvas1.height);

    // and use it to update the mask
    for (let r = 0; r < canvas1.height; r++) {
        for (let c = 0; c < canvas1.width; c++) {
            if (pixels.data[c*4+r*4*canvas1.width +3] > 127){
              mask.mask[r][c] = 1;
            }
        }
    }

    // use it to update the vector mask as well
    for (let i in onefeature.geometry.coordinates) {
      let main = onefeature.geometry.coordinates[i][0]; // no holes ?
      if (!Array.isArray(onefeature.geometry.coordinates[i][0][0]))
        main = onefeature.geometry.coordinates[i];
      // project the points
      var ptsx = main.map(function(value:any,index:any) { return projection(value)![0]; });
      var ptsy = main.map(function(value:any,index:any) { return projection(value)![1]; });
      mask.pols.addPoly(ptsx, ptsy);
    }

    // now with a correct mask we can create the tile
    let tile:Tile = new Tile(Math.floor(xmin), Math.floor(ymin), mask);
    tile.id = j;
    tiles.push(tile);
  }

  if (clipped)
    console.log('clipped '+clipped+' features');
  return tiles;
}

export function voronoiTiling(width:number, height:number,
                              nbsites:number=10, sites:[number, number][]=[]) {
  let rand3 = rn.create('JaeminFredPierreJean-Daniel');
  if (sites.length == 0) {
      for (var i=0; i<nbsites; i++){
          let x = rand3(width);
          let y = rand3(height);
          sites.push([x, y]);
      }
  }
  let tiles:Tile[] = [];
  let voronoi = d3.voronoi().extent([[0, 0], [width , height ]]);
  let polys = voronoi.polygons(sites);

  for (let p in polys){
    let minx = width;
    let maxx = 0;
    let miny = height;
    let maxy = 0;
    let ptsx = [];
    let ptsy = [];

    for (let k=0; k<polys[p].length; k++){
      let x = Math.min(width, Math.max(0, polys[p][k][0]));
      let y = Math.min(height, Math.max(0, polys[p][k][1]));
      ptsx.push(x);
      ptsy.push(y);

      minx = Math.min(minx, x);
      maxx = Math.max(maxx, x);
      miny = Math.min(miny, y);
      maxy = Math.max(maxy, y);
    }

    let mask:Mask = new Mask(Math.ceil(maxx-minx)+1, Math.ceil(maxy-miny)+1, 0);
    let canvas1      = mask.getCanvas();
    let context1:any = canvas1.getContext("2d");

    context1.clearRect(0, 0, canvas1.width, canvas1.height);
    context1.fillStyle="rgba(0, 0, 0, 1.0)";

    context1.beginPath();
    context1.moveTo(polys[p][0][0]-minx, polys[p][0][1]-miny);
    for (let k=1; k<polys[p].length; k++){
      let x = Math.min(width, Math.max(0, polys[p][k][0]));
      let y = Math.min(height, Math.max(0, polys[p][k][1]));
      context1.lineTo(x-minx, y-miny);
    }
    context1.lineTo(polys[p][0][0]-minx, polys[p][0][1]-miny);
    context1.fill();

    mask.pols.addPoly(ptsx, ptsy);
    for (let r = Math.floor(miny); r < Math.ceil(maxy); r++) {
      for (let c = Math.floor(minx); c < Math.ceil(maxx); c++) {
        if (mask.pols.isPointInPoly(-1, c, r)){
          mask.mask[r-Math.floor(miny)][c-Math.floor(minx)] = 1;
        }
      }
    }

    let cx = ptsx.reduce((a, b) => a + b, 0) / ptsx.length;
    let cy = ptsy.reduce((a, b) => a + b, 0) / ptsy.length;

    tiles.push(
        new Tile(Math.floor(minx), Math.floor(miny), mask)
    );
  }

  return tiles;
}



export function rectangularTiling (width:number, height:number, tileWidth:number, tileHeight:number) {
  let rows = Math.ceil(height / tileHeight);
  let cols = Math.ceil(width / tileWidth);
  let tiles:Tile[] = [];

  for(let row = 0; row < rows; row++) {
    for(let col = 0; col < cols; col++) {
      tiles.push(new Tile(col * tileWidth, row * tileHeight, new Mask(tileWidth, tileHeight)));
    }
  }

  return tiles;
}

import Tile from './tile';
import Mask from './mask';
import * as GeoJSON from 'geojson';
import * as d3 from 'd3';
import * as D3Geo from 'd3-geo';
import * as util from './util';
import * as topo from 'topojson';
import * as rn from 'random-seed';

export function pixelTiling (width:number, height:number) {
  let tiles:Tile[] = [];
  for(let row = 0; row < height; row++) {
    for(let col = 0; col < width; col++) {
      tiles.push(new Tile(col, row, new Mask(1, 1)));
    }
  }

  return tiles;
}


export function topojsonTiling(width:number,      height:number,
                               wholetopojson:any, feature:any, debug:boolean=false):Tile[] {
  let tiles:Tile[] = [];

  let allfeatures:any = topo.feature(wholetopojson, feature);
  let projection      = d3.geoMercator().fitSize([width, height], allfeatures);
  let gp              = d3.geoPath(projection);

  if (debug) console.log("debug");

  if (debug) console.log("  "+topo.bbox(wholetopojson));
  // mainland states
  for (let j=0; j<feature.geometries.length; j++){
    // just one shape

    let onefeature:any = topo.feature(wholetopojson, feature.geometries[j]);
    let bb             = gp.bounds(onefeature);

    // now let's create a mask for that shape
    let mask:Mask    = new Mask(Math.ceil(bb[1][0])-Math.floor(bb[0][0]), Math.ceil(bb[1][1])-Math.floor(bb[0][1]), 0);
    let canvas1      = mask.maskCanvas;
    let context1 = canvas1.getContext("2d"); // CanvasRenderingContext2D | null
    if (context1 == null) return [];

    // a new projection for that shape. Normally just a translate from projection
    let projection2  = d3.geoMercator().fitSize([canvas1.width, canvas1.height], onefeature);
    let gp2          = d3.geoPath(projection2);
    let path         = gp2.context(context1);

    // now render the shape (black opaque over black transparent)
    context1.clearRect(0, 0, canvas1.width, canvas1.height);
    context1.fillStyle="rgba(0, 0, 0, 1.0)";
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
    let tile:Tile = new Tile(Math.floor(bb[0][0]), Math.floor(bb[0][1]), mask);
    tile.id = j;
    tiles.push(tile);
  }

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
    let canvas1      = mask.maskCanvas;
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
    tiles.push(new Tile(Math.floor(minx), Math.floor(miny), mask));
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

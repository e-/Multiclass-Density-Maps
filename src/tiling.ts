import Tile from './tile';
import Mask from './mask';
import * as d3 from 'd3';
import * as util from './util';


export function pixelTiling (width:number, height:number) {
  let tiles:Tile[] = [];
  for(let row = 0; row < height; row++) {
    for(let col = 0; col < width; col++) {
      tiles.push(new Tile(col, row, new Mask(1, 1)));
    }
  }

  return tiles;
}

export function topojsonTiling(width:number, height:number, filename:string) {
  util.get(filename).then(response => {
     console.log(response);
  });

  //d3.json(filename, function(error, us) {
  //  if (error) throw error;

    // remove alaska, Hawai and puerto-rico
  //  us.objects.states.geometries.splice(49, 4);
  //});
}

export function voronoiTiling(width:number, height:number, nbsites:number) {
  let tiles:Tile[] = [];
  let voronoi = d3.voronoi().extent([[0, 0], [width , height ]]);
  let sites:[number, number][] = [];//   = d3.range(nbsites).map(function(d) { return [Math.random() * (width) , Math.random() * (height) ];});
   for (var i=0; i<nbsites; i++){
    let x = Math.random()*width;
    let y = Math.random()*height;
    sites.push([x, y]);
  }
  let polys = voronoi.polygons(sites);

  for (let p in polys){
    let minx = width;
    let maxx = 0;
    let miny = height;
    let maxy = 0;
    let ptsx = [];
    let ptsy = [];

    for (let k=0; k<polys[p].length; k++){
      ptsx.push(polys[p][k][0]);
      ptsy.push(polys[p][k][1]);
      minx = Math.min(minx, polys[p][k][0]);
      maxx = Math.max(maxx, polys[p][k][0]);
      miny = Math.min(miny, polys[p][k][1]);
      maxy = Math.max(maxy, polys[p][k][1]);
    }


    let mask:Mask = new Mask(Math.ceil(maxx-minx)+1, Math.ceil(maxy-miny)+1, 0);
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

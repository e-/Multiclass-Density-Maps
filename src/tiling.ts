import Tile from './tile';
import Mask from './mask';

// I will use the voronoi lib without typechecking.
declare var Voronoi:any;

export function pixelTiling (width:number, height:number) {
  let tiles:Tile[] = [];
  for(let row = 0; row < height; row++) {
    for(let col = 0; col < width; col++) {
      tiles.push(new Tile(col, row, new Mask(1, 1)));
    }
  }

  return tiles;
}

export function voronoiTiling(width:number, height:number, nbsites:number) {
  let tiles:Tile[] = [];

  let voronoi:any = new Voronoi();
  let sites = [];
  let bbox = {xl: 0, xr: width, yt: 0.0, yb: height};
  let diagram;

  for (var i=0; i<nbsites; i++){
    let x = Math.random()*width;
    let y = Math.random()*height;
    sites.push({x:x, y:y, id:sites.length});
  }

  diagram = voronoi.compute(sites, bbox);


  for (let c in diagram.cells) {
    let site = diagram.cells[c].site;
    let minx = width;
    let maxx = 0;
    let miny = height;
    let maxy = 0;
    let ptsx = [];
    let ptsy = [];
    for (let he in diagram.cells[c].halfedges) {
      let p1    = diagram.cells[c].halfedges[he].getStartpoint();
      //let p2    = diagram.cells[c].halfedges[he].getEndpoint();
      ptsx.push(p1.x);
      ptsy.push(p1.y);

      minx = Math.min(minx, p1.x);
      maxx = Math.max(maxx, p1.x);
      miny = Math.min(miny, p1.y);
      maxy = Math.max(maxy, p1.y);

      //console.log((maxx-minx)+"x"+(maxy-miny));
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

  for(let row = 0; row < height; row+=4) {
    for(let col = 0; col < width; col+=4) {
      //tiles.push(new Tile(col, row, new Mask(4, 4)));
    }
  }
  voronoi.recycle(diagram);

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

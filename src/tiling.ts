import Tile from './tile';
import Mask from './mask';

export function pixelTiling (width:number, height:number) {
  let tiles:Tile[] = [];
  for(let row = 0; row < height; row++) {
    for(let col = 0; col < width; col++) {
      tiles.push(new Tile(col, row, new Mask(1, 1)));
    }
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

import Tile from './tile';
import Mask from './mask';

export class PixelTiling {
    x = 0;
    y = 0;

    constructor(public width:number, public height:number) {

    }

    [Symbol.iterator]() {
      this.x = 0;
      this.y = 0;
      return this;
    }

    public next() {
      let x = this.x, y = this.y;
      this.x++;
      if (this.x > this.width) {
        this.y++;
        this.x = 0;
      }

      return {
        done: this.y >= this.height,
        value: new Tile(x, y, new Mask(1, 1))
      }
    }
}

export class RectangularTiling {
    rows = 0;
    cols = 0;
    row = 0;
    col = 0;

    constructor(public width:number, public height:number, public tileWidth:number, public tileHeight:number) {
      this.rows = Math.ceil(height / tileHeight);
      this.cols = Math.ceil(width / tileWidth);
    }

    [Symbol.iterator]() {
      this.row = 0;
      this.col = 0;
      return this;
    }

    public next() {
      let row = this.row, col = this.col;
      this.col++;
      if (this.col >= this.cols) {
        this.row++;
        this.col = 0;
      }

      return {
        done: this.row >= this.rows,
        value: new Tile(col * this.tileWidth, row * this.tileHeight, new Mask(this.tileWidth, this.tileHeight))
      }
    }
}

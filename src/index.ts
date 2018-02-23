export class Color {
  constructor(public r:number = 1, public g:number = 1, public b:number = 1, public a:number = 1) {

  }

  clamp() {
    return new Color(
      Math.min(Math.max(this.r, 0), 1),
      Math.min(Math.max(this.g, 0), 1),
      Math.min(Math.max(this.b, 0), 1),
      Math.min(Math.max(this.a, 0), 1)
    );
  }

  clone() {
    return new Color(this.r, this.g, this.b, this.a);
  }

  darken(v:number) {
    return new Color(this.r * v, this.g * v, this.b * v, this.a);
  }

  whiten(v:number) {
    return new Color(
      this.r + (1 - v) * (1 - this.r),
      this.g + (1 - v) * (1 - this.g),
      this.b + (1 - v) * (1 - this.b),
      this.a);
  }

  dissolve(v:number) {
    return new Color(this.r * v, this.g * v, this.b * v, this.a * v);
  }

  add(c:Color) {
    return new Color(
      this.r + c.r,
      this.g + c.g,
      this.b + c.b,
      this.a + c.a
    );
  }

  static compose(a:Color, fa:number, b:Color, fb:number) {
    return new Color(
      a.r * fa + b.r * fb,
      a.g * fa + b.g * fb,
      a.b * fa + b.b * fb,
      a.a * fa + b.a * fb
    );
  }
}

export class Point {
  constructor(public x: number, public y:number) {

  }
}

export class Rect {
  constructor(public min:Point, public max:Point) {

  }
}

function create2D<T>(width:number, height:number, value:T) {
  let arr:T[][] = [];
  for(let i = 0; i < height; ++i) {
    arr.push(new Array(width));
    for(let j = 0; j < width; ++j) {
      arr[i][j] = value;
    }
  }

  return arr;
}

export class Mask {
  constructor(public width:number, public height:number, public mask:number[][] = create2D<number>(width, height, 1)) {

  }
}

export class DataBuffer {
  color:Color = new Color();

  constructor(public name:string, public width:number, public height:number, public values:number[][] = create2D<number>(width, height, 0)) {
  }

  reset() {
    for(let i = 0; i < this.height; ++i) {
      for(let j = 0; j < this.width; ++j) {
        this.values[i][j] = 0;
      }
    }
  }
}

export enum TileAggregation {
  Min,
  Mean, 
  Sum,
  Max
}

export class Tile extends Point {
  constructor(x:number, y:number, public mask:Mask) {
    super(x, y);
  }

  aggregate(buffer:DataBuffer, op:TileAggregation = TileAggregation.Mean): number {
    let val = 0;
    let cnt = 0;

    for(let r = this.y; r < this.y + this.mask.height; r++) {
      if(r >= buffer.height) break;
      for(let c = this.x; c < this.x + this.mask.width; c++) {
        if(c >= buffer.width) break;
        cnt ++;
        if(cnt == 0)
          val = buffer.values[r][c];
        else {
          let current = buffer.values[r][c];
          switch(op) {
            case TileAggregation.Min:
              val = Math.min(val, current);
              break;
            case TileAggregation.Mean:
            case TileAggregation.Sum:
              val += current;
              break;
            case TileAggregation.Max:
              val = Math.max(val, current);
              break;
          }
        }
      }
    }

    if(op === TileAggregation.Mean && cnt > 0) {
      val /= cnt;
    }

    return val;
  }
}

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
      value: new Tile(x, y, new Mask(1, 1, [[1]]))
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

export class Image {
  constructor(public width:number, public height:number, public pixels:Color[][] = create2D<Color>(width, height, new Color())) {
  }
  
  fillByTile(color:Color, tile:Tile) {
    for(let r = tile.y; r < tile.y + tile.mask.height; r++) {
      if(r >= this.height) break;
      for(let c = tile.x; c < tile.x + tile.mask.width; c++) {
        if(c >= this.width) break;

        let v = tile.mask.mask[r - tile.y][c - tile.x];
        this.pixels[r][c] = color.darken(v);
      }
    }
  }

  fillByRect(color:Color, rect:Rect) {
    for(let r = rect.min.y; r < rect.max.y; r++) {
      if(r >= this.height) break;
      for(let c = rect.min.x; c < rect.max.x; c++) {
        if(c >= this.width) break;
        this.pixels[r][c] = color.clone();
      }
    }
  }
}

export class CanvasRenderer {
  static render(image:Image, id:string) {
    let canvas:any = document.getElementById(id);
    canvas.width = image.width;
    canvas.height = image.height;

    let ctx = canvas.getContext('2d');
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = Math.floor(i / 4 / image.width);
      let c = i / 4 % image.width;

      data[i] = image.pixels[r][c].r * 255;
      data[i + 1] = image.pixels[r][c].g * 255;
      data[i + 2] = image.pixels[r][c].b * 255;
      data[i + 3] = image.pixels[r][c].a * 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }
}

import MN from "multivariate-normal";

export class TestMain {
  constructor() {

  }

  randomPointsWithClass(n:number, mean:any, cov:any): any[] {
    let dist = MN(mean, cov);
    return new Array(n).fill(0).map(() => {
      let point = dist.sample();
      return point;
    });
  }

  bin(points:[number, number][], binSize:number, bounds:[[number, number], [number, number]]):number[][] {
    let count = create2D(binSize, binSize, 0);

    points.forEach(([x, y]) => {
      let xb = Math.floor((x - bounds[0][0]) / (bounds[0][1] - bounds[0][0]) * binSize);
      let yb = Math.floor((y - bounds[1][0]) / (bounds[1][1] - bounds[1][0]) * binSize);

      if(xb >= binSize) xb = binSize - 1;
      if(yb >= binSize) yb = binSize - 1;
      if(xb < 0) xb = 0;
      if(yb < 0) yb = 0;

      count[yb][xb]++;
    })

    return count;
  }

  normalize(binned:number[][][]) {
    let arrayMax = (arr:number[]) => Math.max.apply({}, arr);
    let maxValue = arrayMax(binned.map(rows => arrayMax(rows.map(row => arrayMax(row)))))
    return binned.map(rows => rows.map(row => row.map(value => value / maxValue)));
  }

  composeMax(buffers:DataBuffer[], bufferValues:number[]):Color {
    let best = bufferValues[0];
    let bestIndex = 0;

    bufferValues.forEach((bufferValue, i) => {
      if(bufferValue > best) {
        best = bufferValue;
        bestIndex = i;
      }
    });

    return buffers[bestIndex].color.whiten(best);
  }

  composeMix(buffers:DataBuffer[], bufferValues:number[]):Color {
    let sum = 0;
    let ret = new Color(0, 0, 0, 1);

    bufferValues.forEach((bufferValue, i) => {
      sum += bufferValue;
      ret = ret.add(buffers[i].color.whiten(bufferValue));
    });

    if(sum > 0)
      ret = ret.dissolve(1 / buffers.length); // TODO: is this correct?

    return ret;
  }

  main() {
    let nClass = 3;
    let width = 256, height = 256;
    let pointSets:any[] = [
      this.randomPointsWithClass(3000, [2, 3], [[1, 0.3], [0.3, 1]]),
      this.randomPointsWithClass(3000, [-1, -3.5], [[1, -0.1], [-0.1, 1]]),
      this.randomPointsWithClass(3000, [1, -2], [[1, 0.6], [0.6, 1]])
    ];

    // binning on the client side since we do not have a server
    let binned = pointSets.map(points => this.bin(points, width, [[-7, 7], [-7, 7]]))
    
    // normlize bins
    binned = this.normalize(binned);

    // computeDerivedBuffers()
    let dataBuffers:DataBuffer[] = binned.map((binnedPoints, i) => {
      return new DataBuffer(`class ${i}`, width, height, binnedPoints);
    });
    
    let colors:Color[] = [
      new Color(31 / 255, 120 / 255, 180 / 255, 1), // blue
      new Color(255 / 255, 127 / 255, 0 / 255, 1), // orange
      new Color(51 / 255, 160 / 255, 44 / 255, 1) // green
    ];

    // assignProperties()
    dataBuffers.forEach((dataBuffer, i) => {
      dataBuffer.color = colors[i];
    });

    let pixelTiling = new PixelTiling(width, height);
    let outputImage1 = new Image(width, height);

    for(let tile of pixelTiling) { // hope we can use ES2016 
      let bufferValues:number[] = dataBuffers.map(
        (buffer):number => tile.aggregate(buffer, TileAggregation.Sum)
      )

      let color = this.composeMax(dataBuffers, bufferValues);
      outputImage1.fillByTile(color, tile);
    }
    
    CanvasRenderer.render(outputImage1, 'canvas1');

    let rectangularTiling = new RectangularTiling(width, height, width / 64, height / 64);
    let outputImage2 = new Image(width, height);

    for(let tile of rectangularTiling) { // hope we can use ES2016 
      let bufferValues:number[] = dataBuffers.map(
        (buffer):number => tile.aggregate(buffer, TileAggregation.Sum)
      )

      // TODO: we need to RE-normalize buffer values.

      let color = this.composeMax(dataBuffers, bufferValues);
      outputImage2.fillByTile(color, tile);
    }
    
    CanvasRenderer.render(outputImage2, 'canvas2');

    let outputImage3 = new Image(width, height);

    for(let tile of rectangularTiling) { // hope we can use ES2016 
      let bufferValues:number[] = dataBuffers.map(
        (buffer):number => tile.aggregate(buffer, TileAggregation.Sum)
      )

      // TODO: we need to RE-normalize buffer values.

      let color = this.composeMix(dataBuffers, bufferValues);
      outputImage3.fillByTile(color, tile);
    }
    
    CanvasRenderer.render(outputImage3, 'canvas3');
  }
}
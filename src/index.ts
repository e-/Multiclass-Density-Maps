import CanvasRenderer from './canvas-renderer';
import Mask from './mask';
import Image from './image';
import Tile, {TileAggregation} from './tile';
import DataBuffer from './data-buffer';
import Color from './color';
import * as util from './util';
import * as Tiling from './tiling';
import Composer from './composer';
import * as Parser from './parser';
import DerivedBuffer from './derived-buffer';
import * as Scale from './scale';

/// <reference path="multivariate-normal.d.ts" />
import MN from "multivariate-normal";

export class TestMain {
  constructor() {

  }

  parse(json: any) : Parser.Configuration {
      return Parser.parse(json);
  }

  randomPointsWithClass(n:number, mean:any, cov:any): any[] {
    let dist = MN(mean, cov);
    return new Array(n).fill(0).map(() => {
      let point = dist.sample();
      return point;
    });
  }

  bin(points:[number, number][], binSize:number, bounds:[[number, number], [number, number]]):number[][] {
    let count = util.create2D(binSize, binSize, 0);

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


  main() {
    let nClass = 3;
    let width = 256, height = 256;
    let pointSets:any[] = [
      this.randomPointsWithClass(3000, [2, 3], [[1, 0.3], [0.3, 1]]),
      this.randomPointsWithClass(3000, [-1, -3.5], [[1, -0.1], [-0.1, 1]]),
      this.randomPointsWithClass(3000, [1, -2], [[1, 0.6], [0.6, 1]])
    ];

    // data buffers contain density information that can be either created by a server or read from files (e.g., json).
    let dataBuffers = pointSets.map((points, i) => new DataBuffer(`class ${i}`, width, height, this.bin(points, width, [[-7, 7], [-7, 7]])));

    // tiling now returns an 1D array of tiles
    let rectTiles = Tiling.rectangularTiling(width, height, width / 128, height / 128);

    for(let tile of rectTiles) {
        // tile.dataValues are an array of numbers
        tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
    }

    // get max count of bins for scale
    let maxCount = util.amax(rectTiles.map(tile => util.amax(tile.dataValues)));

    // assignProperties()
    let derivedBuffers1 = dataBuffers.map((dataBuffer, i) => {
        let derivedBuffer = new DerivedBuffer(dataBuffer);

        derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount], [Color.White, Color.Category3[i]]);

        return derivedBuffer;
    });

    let derivedBuffers2 = dataBuffers.map((dataBuffer, i) => {
        let derivedBuffer = new DerivedBuffer(dataBuffer);

        derivedBuffer.colorScale = new Scale.LogColorScale([1, maxCount], [Color.White, Color.Category3[i]]);

        return derivedBuffer;
    });

    let derivedBuffers3 = dataBuffers.map((dataBuffer, i) => {
        let derivedBuffer = new DerivedBuffer(dataBuffer);

        derivedBuffer.colorScale = new Scale.EquiDepthColorScale(
            rectTiles.map(tile => tile.dataValues[i]).filter(c => c > 0),
            [Color.White, Color.Category3[i]], 3);

        return derivedBuffer;
    });

    let outputImage1 = new Image(width, height);
    let outputImage2 = new Image(width, height);
    let outputImage3 = new Image(width, height);

    for(let tile of rectTiles) {
        let color1 = Composer.max(derivedBuffers1, tile.dataValues);
        outputImage1.fillByTile(color1, tile);

        let color2 = Composer.max(derivedBuffers2, tile.dataValues);
        outputImage2.fillByTile(color2, tile);

        let color3 = Composer.max(derivedBuffers3, tile.dataValues);
        outputImage3.fillByTile(color3, tile);
    }

    CanvasRenderer.render(outputImage1, 'canvas1');
    CanvasRenderer.render(outputImage2, 'canvas2');
    CanvasRenderer.render(outputImage3, 'canvas3');

    let bigRectTiles = Tiling.rectangularTiling(width, height, width / 16, height / 16);

    for(let tile of bigRectTiles) {
        tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
    }

    let maxCount2 = util.amax(bigRectTiles.map(tile => util.amax(tile.dataValues)));

    let randomMasks = Mask.generateWeavingRandomMasks(dataBuffers.length, 4, width, height);
    let squareMasks = Mask.generateWeavingSquareMasks(dataBuffers.length, 4, width, height);

    let derivedBuffers4 = dataBuffers.map((dataBuffer, i) => {
        let derivedBuffer = new DerivedBuffer(dataBuffer);

        derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category3[i]]);
        derivedBuffer.mask = randomMasks[i];

        return derivedBuffer;
    });

    let derivedBuffers5 = dataBuffers.map((dataBuffer, i) => {
        let derivedBuffer = new DerivedBuffer(dataBuffer);

        derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category3[i]]);
        derivedBuffer.mask = squareMasks[i];

        return derivedBuffer;
    });

    let outputImage4 = new Image(width, height);
    let outputImage5 = new Image(width, height);

    for(let tile of bigRectTiles) {
        derivedBuffers4.forEach((derivedBuffer, i) => {
            let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
            outputImage4.fillByTile(color, tile, derivedBuffer.mask);
        });

        derivedBuffers5.forEach((derivedBuffer, i) => {
            let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
            outputImage5.fillByTile(color, tile, derivedBuffer.mask);
        });
    }

    CanvasRenderer.render(outputImage4, 'canvas4');
    CanvasRenderer.render(outputImage5, 'canvas5');
  }
}

export * from './vega-extractor';

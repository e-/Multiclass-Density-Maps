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
import Polys2D from './polys2D'
import * as d3 from 'd3';

/// <reference path="multivariate-normal.d.ts" />
import MN from "multivariate-normal";


export class TestMain {
    constructor() {

    }

    parse_url(url:string, callback:(conf:Parser.Configuration)=>void) {
        util.get(url).then(response => {
            let config = new Parser.Configuration(response);

            // when we call load(), data spec and buffers are really loaded through AJAX
            return config.load('data/');
        })
        .then(callback);
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
        });

        return count;
    }

    normalize(binned:number[][][]) {
        let arrayMax = (arr:number[]) => Math.max.apply({}, arr);
        let maxValue = arrayMax(binned.map(rows => arrayMax(rows.map(row => arrayMax(row)))))
        return binned.map(rows => rows.map(row => row.map(value => value / maxValue)));
    }

    dataBuffers:DataBuffer[] = [];
    width:number             = 256;
    height:number            = 256;

    main() {


        // general settings for the examples
        let fineTileSize = 2;
        let bigTileSize = 8;

        let nClass = 4;
        let pointSets:any[] = [
      this.randomPointsWithClass(5000, [-1, -1], [[3, 0], [0, 3]]),
      this.randomPointsWithClass(5000, [1, -1],  [[3, 0], [0, 3]]),
      this.randomPointsWithClass(5000, [-1, 1],  [[3, 0], [0, 3]]),
      this.randomPointsWithClass(5000, [1, 1],   [[3, 0], [0, 3]])
        ];

        // data buffers contain density information that can be either created by a server or read from files (e.g., json).
        this.dataBuffers = pointSets.map((points, i) => new DataBuffer(`class ${i}`, this.width, this.height, this.bin(points, this.width, [[-7, 7], [-7, 7]])));


        // tiling now returns an 1D array of tiles
        let rectTiles = Tiling.rectangularTiling(this.width, this.height, fineTileSize, fineTileSize);

        for(let tile of rectTiles) {
            // tile.dataValues are an array of numbers
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }

        // get max count of bins for scale
        let maxCount = util.amax(rectTiles.map(tile => util.amax(tile.dataValues)));

        // assignProperties()
        let derivedBuffers1 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount], [Color.White, Color.Category10[i]]);

            return derivedBuffer;
        });

        let derivedBuffers2 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LogColorScale([1, maxCount], [Color.White, Color.Category10[i]]);

            return derivedBuffer;
        });

        let derivedBuffers3 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.EquiDepthColorScale(
                rectTiles.map(tile => tile.dataValues[i]).filter(c => c > 0),
                [Color.White, Color.Category10[i]], 3);

            return derivedBuffer;
        });

        let outputImage1 = new Image(this.width, this.height);
        let outputImage2 = new Image(this.width, this.height);
        let outputImage3 = new Image(this.width, this.height);

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

        let bigRectTiles = Tiling.rectangularTiling(this.width, this.height, bigTileSize, bigTileSize);

        for(let tile of bigRectTiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }

        let maxCount2 = util.amax(bigRectTiles.map(tile => util.amax(tile.dataValues)));
        console.log("  maxCount2:"+maxCount2);

        let randomMasks = Mask.generateWeavingRandomMasks(this.dataBuffers.length, bigTileSize, this.width, this.height);
        let squareMasks = Mask.generateWeavingSquareMasks(this.dataBuffers.length, bigTileSize, this.width, this.height);

        let derivedBuffers4 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category10[i]]);
            derivedBuffer.mask = randomMasks[i];

            return derivedBuffer;
        });

        let derivedBuffers5 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category10[i]]);
            derivedBuffer.mask = squareMasks[i];

            return derivedBuffer;
        });


        let outputImage4 = new Image(this.width, this.height);
        let outputImage5 = new Image(this.width, this.height);

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


        let outputImage7 = new Image(this.width, this.height);
        let outputImage8 = new Image(this.width, this.height);

        for(let tile of rectTiles) {
            let color7 = Composer.mean(derivedBuffers1, tile.dataValues);
            outputImage7.fillByTile(color7, tile);

            let color8 = Composer.additiveMix(derivedBuffers1, tile.dataValues);
            outputImage8.fillByTile(color8, tile);
        }

        CanvasRenderer.render(outputImage7, 'canvas7');
        CanvasRenderer.render(outputImage8, 'canvas8');

        this.testHexa(-1);

        this.testVoronoi(16);

        // Testing Spec
        this.testVisSpec();
    }

    testHexa(id:number){
        // testing polys
        let po:Polys2D = new Polys2D("test");
        po.addPoly([1.5, 3.5, 2.0], [1.0, 1.5, 3.0]);
        po.addPoly([2.0, 4.0, 3.0], [4.0, 2.0, 5.0]);
        console.log("Run polygon tests ");
        console.log("  should be true:"+ po.isPointInPolys(2.5, 2.0)+" "+po.isPointInPolys(2.0, 2.5)+" "+po.isPointInPolys(3.0, 4.0)+" "+po.isPointInPolys(2.5, 2.0)+" "+po.isPointInPolys(2.99, 2.0));
        console.log("  should be false:"+po.isPointInPolys(2.5, 1.1)+" "+po.isPointInPolys(3.0, 2.5)+" "+po.isPointInPolys(2.5, 2.8)+" "+po.isPointInPolys(1.6, 2.0)+" "+po.isPointInPolys(3.01, 2.0));
        console.log("  borderline:"+     po.isPointInPolys(3.0, 2.0)+" "+po.isPointInPolys(3.0, 3.0));

        // tiling now returns an 1D array of tiles
        //let rectTiles = Tiling.rectangularTiling(this.width, this.height, this.width / 128, this.height / 128);

        //for(let tile of rectTiles) {
            // tile.dataValues are an array of numbers
        //    tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        //}
        let hexaMasks   = Mask.generateWeavingHexaMasks(this.dataBuffers.length,   8, this.width, this.height);
        let bigRectTiles = Tiling.rectangularTiling(this.width, this.height, this.width / 16, this.height / 16);


        for(let tile of bigRectTiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }
        let maxCount2 = util.amax(bigRectTiles.map(tile => util.amax(tile.dataValues)));

        let derivedBuffers6 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category10[i]]);
            derivedBuffer.mask = hexaMasks[i];

            return derivedBuffer;
        });
        let outputImage6 = new Image(this.width, this.height);

        //outputImage6.fillByShapedTile(bigRectTiles, derivedBuffers6);
        if (id<0)
          for(let tile of bigRectTiles) {
            derivedBuffers6.forEach((derivedBuffer, i) => {
                let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                outputImage6.fillByTile(color, tile, derivedBuffer.mask);
            });
          }
        else{
          outputImage6.fillMask(derivedBuffers6[id].mask);
        }

        CanvasRenderer.render(outputImage6, 'canvas6');
    }

    testVoronoi(n:number){
        // tiling now returns an 1D array of tiles
        let randomMasks = Mask.generateWeavingRandomMasks(this.dataBuffers.length, 4, this.width, this.height);
        let voronoiTiles = Tiling.voronoiTiling(this.width, this.height, n);

        for(let tile of voronoiTiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }
        let maxCount2 = util.amax(voronoiTiles.map(tile => util.amax(tile.dataValues)));

        let derivedBuffers9 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category10[i]]);
            derivedBuffer.mask = randomMasks[i];

            return derivedBuffer;
        });
        let outputImage9 = new Image(this.width, this.height);

        for(let tile of voronoiTiles) {
          derivedBuffers9.forEach((derivedBuffer, i) => {
              let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
              outputImage9.fillByTile(color, tile, derivedBuffer.mask);
          });
        }

        CanvasRenderer.render(outputImage9, 'canvas9');

        if(d3.select("#borderVoronoi").property("checked"))
          for (let k in voronoiTiles)
            CanvasRenderer.drawVectorMask(voronoiTiles[k].mask, 'canvas9');
    }

    testVisSpec() {
        util.get('data/census_data.json').then(response => {
            let config = new Parser.Configuration(response);

            // when we call load(), data spec and buffers are really loaded through AJAX
            return config.load('data/');
        }).then((config:Parser.Configuration) => {
            console.log(config);

            let width = 512;
            let height = 280;

            let dataBuffers = config.data!.dataSpec!.buffers!.map((bufferSpec) =>
              new DataBuffer('test', width, height, bufferSpec.data)
            );

            let tiles = Tiling.rectangularTiling(width, height, width / 128, height / 70);

            for(let tile of tiles) {
                // tile.dataValues are an array of numbers
                tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
            }

            // get max count of bins for scale
            let maxCount = util.amax(tiles.map(tile => util.amax(tile.dataValues)));

            let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
                let derivedBuffer = new DerivedBuffer(dataBuffer);

                derivedBuffer.colorScale = new Scale.LogColorScale([1, maxCount], [Color.White, Color.Category10[i]]);

                return derivedBuffer;
            });

            let outputImage = new Image(width, height);

            for(let tile of tiles) {
                let color1 = Composer.max(derivedBuffers, tile.dataValues);
                outputImage.fillByTile(color1, tile);
            }

            CanvasRenderer.render(outputImage, 'canvas10');
        });
    }

    testUSShapes(debug:number) {
        util.get('data/census_data.json').then(response => {
            let config = new Parser.Configuration(response);

            // when we call load(), data spec and buffers are really loaded through AJAX
            return config.load('data/');
        }).then((config:Parser.Configuration) => {
          //console.log(config);

          let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins;
          let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins;

          if (!width || !height) {
            width  = 256;
            height  =256;
          }

          util.get("data/us.json").then(result => {
            let topous = JSON.parse(result);

            let dataBuffers = config.data!.dataSpec!.buffers!.map((bufferSpec, i) => {
              let db:DataBuffer = new DataBuffer('test', width?width:100, height?height:100, bufferSpec.data);
              return db;
              }
            );

            let ustiles = Tiling.topojsonTiling(width!, height!, topous);

            let randomMasks = Mask.generateWeavingRandomMasks(dataBuffers.length, 4, width!, height!);

            for(let tile of ustiles) {
                // tile.dataValues are an array of numbers
                tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
            }

            // get max count of bins for scale
            let maxCount = util.amax(ustiles.map(tile => util.amax(tile.dataValues)));

            let derivedBuffers11 = dataBuffers.map((dataBuffer, i) => {
                let derivedBuffer = new DerivedBuffer(dataBuffer);

                derivedBuffer.colorScale = new Scale.LinearColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
                derivedBuffer.mask       = randomMasks[i];

                return derivedBuffer;
            });

            let outputImage11 = new Image(width!, height!);

            for(let tile of ustiles) {
              derivedBuffers11.forEach((derivedBuffer, i) => {
                  let color = derivedBuffers11[i].colorScale.map(tile.dataValues[i]);
                  outputImage11.fillByTile(color, tile, derivedBuffers11[i].mask);
              });
            }
            let color = derivedBuffers11[0].colorScale.map(ustiles[0].dataValues[0]);
            outputImage11.fillByTileDebug(color, ustiles[0], derivedBuffers11[0].mask);

            color = derivedBuffers11[1].colorScale.map(ustiles[0].dataValues[1]);
            outputImage11.fillByTileDebug(color, ustiles[0], derivedBuffers11[1].mask);

            color = derivedBuffers11[2].colorScale.map(ustiles[0].dataValues[2]);
            outputImage11.fillByTileDebug(color, ustiles[0], derivedBuffers11[2].mask);

            color = derivedBuffers11[3].colorScale.map(ustiles[0].dataValues[3]);
            outputImage11.fillByTileDebug(color, ustiles[0], derivedBuffers11[3].mask);

            //color = derivedBuffers11[4].colorScale.map(ustiles[0].dataValues[4]);
            //outputImage11.fillByTileDebug(color, ustiles[0], derivedBuffers11[4].mask);



            //outputImage11.fillMask(derivedBuffers11[0].mask);
            //outputImage11.fillMask(ustiles[0].mask);

            CanvasRenderer.render(outputImage11, 'canvas11');

            //for(let tile of ustiles) {
            //    d3.select("#debugus").append(function() { return tile.mask.maskCanvas;});
            //}
            for(let tile of ustiles) CanvasRenderer.drawVectorMask(tile.mask, 'canvas11');

          });

        })
    }
}

export * from './vega-extractor';

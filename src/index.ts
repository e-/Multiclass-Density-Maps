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
import Interpreter from './interp';

import jquery from 'jquery';
import 'jquery-ui';
import "jquery-ui/ui/widgets/slider";

/// <reference path="multivariate-normal.d.ts" />
import MN from "multivariate-normal";
import LegendBuilder from "./legend";

export class TestMain {
    constructor() {

    }

    create_configuration(json:any) {
        return new Parser.Configuration(json);
    }

    create_interp(conf:Parser.Configuration) {
        return new Interpreter(conf);
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

        let derivedBuffers8 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale(
                [0, maxCount], [Color.Black, Color.Category10[i]]);

            return derivedBuffer;
        });

        let derivedBuffers2 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LogColorScale(
                [1, maxCount], [Color.White, Color.Category10[i]]);

            return derivedBuffer;
        });

        let derivedBuffers3 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);
            createEquiDepthColormap(derivedBuffer,
                                    [0, maxCount],
                                    [Color.White, Color.Category10[i]],
                                    rectTiles, i);
            return derivedBuffer;
        });

        let outputImage1 = new Image(this.width, this.height);
        let outputImage2 = new Image(this.width, this.height);
        let outputImage3 = new Image(this.width, this.height);

        for(let tile of rectTiles) {
            let color1 = Composer.max(derivedBuffers1, tile.dataValues);
            outputImage1.render(color1, tile);

            let color2 = Composer.max(derivedBuffers2, tile.dataValues);
            outputImage2.render(color2, tile);

            let color3 = Composer.max(derivedBuffers3, tile.dataValues);
            outputImage3.render(color3, tile);
        }

        CanvasRenderer.render(outputImage1, 'canvas1');
        CanvasRenderer.render(outputImage2, 'canvas2');
        CanvasRenderer.render(outputImage3, 'canvas3');
        // CanvasRenderer.render(outputImage3, 'canvas3-blurred', {blur: 10});

        let bigRectTiles = Tiling.rectangularTiling(this.width, this.height, bigTileSize, bigTileSize);

        for(let tile of bigRectTiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }

        let maxCount2 = util.amax(bigRectTiles.map(tile => util.amax(tile.dataValues)));

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
                outputImage4.render(color, tile, derivedBuffer.mask);
            });

            derivedBuffers5.forEach((derivedBuffer, i) => {
                let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                outputImage5.render(color, tile, derivedBuffer.mask);
            });
        }

        CanvasRenderer.render(outputImage4, 'canvas4');
        CanvasRenderer.render(outputImage5, 'canvas5');


        let outputImage7 = new Image(this.width, this.height);
        let outputImage8 = new Image(this.width, this.height);

        for(let tile of rectTiles) {
            let color7 = Composer.mean(derivedBuffers1, tile.dataValues);
            outputImage7.render(color7, tile);

            let color8 = Composer.additiveMix(derivedBuffers8, tile.dataValues);
            outputImage8.render(color8, tile);
        }

        CanvasRenderer.render(outputImage7, 'canvas7');
        CanvasRenderer.render(outputImage8, 'canvas8');

        let me = this;



        jquery( "#slider16" ).css("background", "#ddd").slider({
            min:   1,
            value: 2,
            max:   16,
            slide:function( event:any, ui:any){
                me.testVoronoiHatching();
            }
        });

        this.testHexa(-1);
        this.testTriang(-1);

        this.testVoronoiWeaving();
        this.testVoronoiHatching();

        // small multiples

        // prepare nClass images
        let outputImages:Image[] = new Array(this.dataBuffers.length).fill(0).map(() => new Image(this.width, this.height));

        derivedBuffers3.forEach((derivedBuffer, i) => {
            for(let tile of rectTiles) {
                let color = Composer.one(derivedBuffer, tile.dataValues[i]);
                outputImages[i].render(color, tile);
            }
        })

        CanvasRenderer.renderMultiples(outputImages, 'canvas12');

        this.figures();
        // this.testUSVega();
        // this.testPunchcard();
    }

    testHexa(id:number){
        // testing polys
        //let po:Polys2D = new Polys2D("test");
        //po.addPoly([1.5, 3.5, 2.0], [1.0, 1.5, 3.0]);
        //po.addPoly([2.0, 4.0, 6.0], [4.0, 2.0, 6.0]);
        //console.log("Run polygon tests ");
        //console.log("  should be true:"+ po.isPointInPolys(2.5, 2.0)+" "+po.isPointInPolys(2.0, 2.5)+" "+po.isPointInPolys(3.0, 4.0)+" "+po.isPointInPolys(2.5, 2.0)+" "+po.isPointInPolys(2.99, 2.0));
        //console.log("  should be false:"+po.isPointInPolys(2.5, 1.1)+" "+po.isPointInPolys(3.0, 2.5)+" "+po.isPointInPolys(2.5, 2.8)+" "+po.isPointInPolys(1.6, 2.0)+" "+po.isPointInPolys(3.01, 2.0));
        //console.log("  borderline:"+    po.isPointInPolys(1.75, 2.0)+" "+po.isPointInPolys(3.0, 3.0)+" "+po.isPointInPolys(3.0, 3.0)+" "+po.isPointInPolys(3.0, 4.5)+" "+po.isPointInPolys(5.0, 4.0));

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
                outputImage6.render(color, tile, derivedBuffer.mask);
            });
          }
        else{
           outputImage6.fillMask(derivedBuffers6[id].mask);
        }

        CanvasRenderer.render(outputImage6, 'canvas6');
    }

    testTriang(id:number){

        let triangMasks   = Mask.generateWeavingTriangleMasks(this.dataBuffers.length,   8, this.width, this.height);
        let bigRectTiles = Tiling.rectangularTiling(this.width, this.height, this.width / 16, this.height / 16);


        for(let tile of bigRectTiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }
        let maxCount2 = util.amax(bigRectTiles.map(tile => util.amax(tile.dataValues)));

        let derivedBuffers17 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category10[i]]);
            derivedBuffer.mask = triangMasks[i];

            return derivedBuffer;
        });
        let outputImage17 = new Image(this.width, this.height);

        //outputImage6.fillByShapedTile(bigRectTiles, derivedBuffers6);
        if (id<0)
          for(let tile of bigRectTiles) {
            derivedBuffers17.forEach((derivedBuffer, i) => {
                let color = derivedBuffer.colorScale.map(tile.dataValues[i]);
                outputImage17.render(color, tile, derivedBuffer.mask);
            });
          }
        else{
           outputImage17.fillMask(derivedBuffers17[id].mask);
        }

        CanvasRenderer.render(outputImage17, 'canvas17');
    }

    testVoronoiWeaving(){
        // tiling now returns an 1D array of tiles
        let n            = parseInt(jquery("#compo9 option:selected").text());
        let randomMasks  = Mask.generateWeavingRandomMasks(this.dataBuffers.length, 4, this.width, this.height);
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
              outputImage9.render(color, tile, derivedBuffer.mask);
          });
        }

        CanvasRenderer.render(outputImage9, 'canvas9');

        if(d3.select("#border9").property("checked"))
          for (let k in voronoiTiles)
            CanvasRenderer.strokeVectorMask(voronoiTiles[k].mask, 'canvas9');
    }

    testVoronoiHatching(){
        // tiling now returns an 1D array of tiles
        let n            = parseInt(jquery("#compo16 option:selected").text());
        let randomMasks  = Mask.generateWeavingRandomMasks(this.dataBuffers.length, 4, this.width, this.height);
        let voronoiTiles = Tiling.voronoiTiling(this.width, this.height, n);


        for(let tile of voronoiTiles) {
            tile.dataValues = tile.aggregate(this.dataBuffers, TileAggregation.Sum);
        }
        let maxCount2 = util.amax(voronoiTiles.map(tile => util.amax(tile.dataValues)));

        let derivedBuffers16 = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.colorScale = new Scale.LinearColorScale([0, maxCount2], [Color.White, Color.Category10[i]]);
            //derivedBuffer.mask = randomMasks[i];

            return derivedBuffer;
        });
        let outputImage16 = new Image(this.width, this.height);


        let hatchingSize  = jquery("#slider16").slider("option", "value");

        for(let tile of voronoiTiles) {
          let colors:Color[] = [];


          for(let i in derivedBuffers16)
              if (jquery("#compo16c option:selected").text()=='Color')
                  derivedBuffers16[i].color = derivedBuffers16[i].colorScale.map(tile.dataValues[i]);
              else
                  derivedBuffers16[i].color = Color.Category10[i];

              let hatch:any = Composer.hatch(tile, derivedBuffers16, hatchingSize, true);
              outputImage16.render(
                hatch,
                tile.center
              );
        }

        CanvasRenderer.render(outputImage16, 'canvas16');

        if(d3.select("#border16").property("checked"))
          for (let k in voronoiTiles)
            CanvasRenderer.strokeVectorMask(voronoiTiles[k].mask, 'canvas16');
    }

    figures() {
        util.get('data/census_data.json').then(response => {
            let config = new Parser.Configuration(response);

            return config.load('data/');
        }).then((config:Parser.Configuration) => {
            util.get("data/us.json").then(result => {
                let topous = JSON.parse(result);
                //topous.objects['states'].geometries.splice(47, 4);

                this.figure1a (config, topous);
                this.figure1b (config, topous);
                this.figure1c1(config, topous);
                this.figure1c2(config, topous);
                this.figure1e (config, topous);
                this.figure1f (config, topous);
                this.figure1g (config, topous);
            });
        });
    }

    figure1a(config:Parser.Configuration, topous:any, update:boolean=false) {
       let me = this;
        let savedConfig = config;
        let savedTopous = topous;
        if (!update){
            jquery( "#slider1a" ).css("background", "#ddd").slider({
                min:   0,
                value: 0,
                max:   16,
                change:function( event:any, ui:any){me.figure1a(savedConfig, savedTopous, true);}
              }
            );
            jquery("#compo1aa").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
            jquery("#compo1ab").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
            jquery("#compo1ac").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
            jquery("#compo1ad").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
            jquery("#compo1ae").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
            jquery("#compo1af").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
            jquery("#border1a").change(function(){ me.figure1a(savedConfig, savedTopous, true);});
        }

        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;

        let size = 1;
        let blurSize = jquery("#slider1a").slider("option", "value");
        //console.log(blurSize);

        let dataBuffers = config.data!.dataSpec!.buffers!.slice(0, parseInt(jquery("#compo1ac option:selected").text())).map((bufferSpec) =>
            new DataBuffer(bufferSpec.value, width, height, bufferSpec.data).blur(blurSize)
        );

        let tiles = Tiling.rectangularTiling(width, height, size, size);

        let aggreg =jquery("#compo1aa option:selected").text();
        for(let i in tiles) {
          let tile = tiles[i];
          // tile.dataValues are an array of numbers
          if (aggreg=='Min')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Min);
          else if (aggreg=='Sum')
             tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
          else if (aggreg=='Mean')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Mean);
          else if (aggreg=='Max')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Max);
        }

        // get max count of bins for scale
        let maxCount = util.amax(tiles.map(tile => util.amax(tile.dataValues)));

        let svg = d3.select("#legend1a-legend");
        svg.selectAll("*").remove();

        let colscale =jquery("#compo1ab option:selected").text();
        let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            if (colscale=="Linear")
                derivedBuffer.colorScale = new Scale.LinearColorScale    ([0, maxCount], [Color.Category10a[i].brighter(), Color.Category10a[i].darker()]);
            else if (colscale=="Log")
                derivedBuffer.colorScale = new Scale.LogColorScale       ([0, maxCount], [Color.Category10a[i].brighter(), Color.Category10a[i].darker()]);
            else if (colscale=="CubicRoot")
               derivedBuffer.colorScale = new Scale.CubicRootColorScale  ([0, maxCount], [Color.Category10a[i].brighter(), Color.Category10a[i].darker()]);
            else if (colscale=="SquareRoot")
                derivedBuffer.colorScale = new Scale.SquareRootColorScale([0, maxCount], [Color.Category10a[i].brighter(), Color.Category10a[i].darker()]);
            else if (colscale=="EquiDepth"){
                createEquiDepthColormap(derivedBuffer,
                                        [0, maxCount],
                                        [Color.Category10a[i].brighter(),
                                         Color.Category10a[i].darker()],
                                        tiles, i);
            }

            for (let k=0; k<8; k++){
              let col = derivedBuffer.colorScale.map(k*maxCount/7);
              svg.append("circle")
                .attr("fill", col.css())
                .attr("r", 10)
                .attr("cx", ""+(110-i*20))
                .attr("cy", ""+(50-k*5));
            }

            svg.append("text")
              .attr("fill", "black")
              .attr("x", ""+(105-i*20))
              .attr("y", "50")
              .text(dataBuffer.name);


            return derivedBuffer;
        });

        let outputImage = new Image(width, height);

        for(let tile of tiles) {
            let color1 = Composer.mean(derivedBuffers, tile.dataValues);
            outputImage.render(color1, tile);
        }

        CanvasRenderer.render(outputImage, 'fig1a');

        let geo  = config.getGeo();

        let ustiles = Tiling.topojsonTiling(width, height,
                                            topous, topous.objects.states,
                                            geo.projection, geo.latitudes, geo.longitudes,
                                            true
                                           );

        if(d3.select("#border1a").property("checked"))
          for(let tile of ustiles)
            CanvasRenderer.strokeVectorMask(tile.mask, 'fig1a', {color:'#000'});
    }

    figure1b(config:Parser.Configuration, topous:any, update:boolean=false) {

        let me = this;
        let savedConfig = config;
        let savedTopous = topous;
        if (!update){
            jquery( "#slider1b" ).css("background", "#ddd").slider({
                min:   0,
                value: 0,
                max:   16,
                change:function( event:any, ui:any){me.figure1b(savedConfig, savedTopous, true);}
              }
            );
            jquery("#compo1ba").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
            jquery("#compo1bb").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
            jquery("#compo1bc").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
            jquery("#compo1bd").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
            jquery("#compo1be").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
            jquery("#compo1bf").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
            jquery("#border1b").change(function(){ me.figure1b(savedConfig, savedTopous, true);});
        }

        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;
        let blurSize = jquery("#slider1b").slider("option", "value");

        let dataBuffers = config.data!.dataSpec!.buffers!.slice(0, parseInt(jquery("#compo1bc option:selected").text())).map((bufferSpec) =>
            new DataBuffer('test', width, height, bufferSpec.data).blur(blurSize)
        );

        let geo = config.getGeo();

        let ustiles = Tiling.topojsonTiling(width, height!,
                                            topous, topous.objects.states,
                                            geo.projection, geo.latitudes, geo.longitudes);

        let aggreg =jquery("#compo1ba option:selected").text();
        for(let tile of ustiles) {
             // tile.dataValues are an array of numbers
           if (aggreg=='Min')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Min);
           else if (aggreg=='Sum')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
           else if (aggreg=='Mean')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Mean);
           else if (aggreg=='Max')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Max);
        }

        let maxCount = util.amax(ustiles.map(tile => util.amax(tile.dataValues)));

        // NOTE: manipulated maxCount to balance colors
        // NOTE2: replaced by local max for the given buffer
        let colscale =jquery("#compo1bb option:selected").text();
        let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);
            let locMaxCount = util.amax(ustiles.map(tile => tile.dataValues[i]));

            if (colscale=="Linear")
                derivedBuffer.colorScale = new Scale.LinearColorScale([0, locMaxCount], [Color.White, Color.Category10b[i].darker()]);
            else if (colscale=="Log")
                derivedBuffer.colorScale = new Scale.LogColorScale([0, locMaxCount], [Color.White, Color.Category10b[i].darker()]);
            else if (colscale=="CubicRoot")
               derivedBuffer.colorScale = new Scale.CubicRootColorScale([0, locMaxCount], [Color.White, Color.Category10b[i].darker()]);
            else if (colscale=="SquareRoot")
                derivedBuffer.colorScale = new Scale.SquareRootColorScale([0, locMaxCount], [Color.White, Color.Category10b[i].darker()]);
            else if (colscale=="EquiDepth"){
                createEquiDepthColormap(derivedBuffer,
                                        [0, locMaxCount],
                                        [Color.White, Color.Category10b[i]],
                                        ustiles, i);
            }
            return derivedBuffer;
        });
        //derivedBuffers[0].colorScale = new Scale.CubicRootColorScale([1, maxCount], [Color.White, Color.Red]);
        //derivedBuffers[1].colorScale = new Scale.CubicRootColorScale([1, maxCount / 10], [Color.White, Color.Yellow]);
        //derivedBuffers[2].colorScale = new Scale.CubicRootColorScale([1, maxCount / 100], [Color.White, Color.Blue]);

        let outputImage = new Image(width, height);

        for(let tile of ustiles) {
            let color = Composer.multiplicativeMix(derivedBuffers, tile.dataValues);
            outputImage.render(color, tile);
        }

        CanvasRenderer.render(outputImage, 'fig1b');

        if(d3.select("#border1b").property("checked"))
          for(let tile of ustiles)
              CanvasRenderer.strokeVectorMask(tile.mask, 'fig1b');
    }

    figure1c1(config:Parser.Configuration, topous:any, update:boolean=false) {
        let me = this;
        let savedConfig = config;
        let savedTopous = topous;
        if (!update){
            jquery( "#slider1c1" ).css("background", "#ddd").slider({
                min:   1,
                value: 2,
                max:   16,
                change:function( event:any, ui:any){me.figure1c1(savedConfig, savedTopous, true);}
              }
            );
            jquery("#compo1c1a").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
            jquery("#compo1c1b").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
            jquery("#compo1c1c").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
            jquery("#compo1c1d").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
            jquery("#compo1c1e").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
            jquery("#compo1c1f").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
            jquery("#border1c1").change(function(){ me.figure1c1(savedConfig, savedTopous, true);});
        }

        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;

        let dataBuffers = config.data!.dataSpec!.buffers!.map((bufferSpec, i) => new DataBuffer(bufferSpec.value, width, height, bufferSpec.data));

        let geo = config.getGeo();
        let ustiles = Tiling.topojsonTiling(width, height, topous, topous.objects.states,
                                            geo.projection, geo.latitudes, geo.longitudes);

        let aggreg =jquery("#compo1c1a option:selected").text();
        for(let tile of ustiles) {
           if (aggreg=='Min')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Min);
           else if (aggreg=='Sum')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
           else if (aggreg=='Mean')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Mean);
           else if (aggreg=='Max')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Max);
        }

        let maxCount = util.amax(ustiles.map(tile => util.amax(tile.dataValues)));

        let colscale =jquery("#compo1c1b option:selected").text();
        let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

             if (colscale=="Linear")
                 derivedBuffer.colorScale = new Scale.LinearColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
             else if (colscale=="Log")
                 derivedBuffer.colorScale = new Scale.LogColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
             else if (colscale=="CubicRoot")
                derivedBuffer.colorScale = new Scale.CubicRootColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
             else if (colscale=="SquareRoot")
                 derivedBuffer.colorScale = new Scale.SquareRootColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
            else if (colscale=="EquiDepth") {
                createEquiDepthColormap(derivedBuffer,
                                        [0, maxCount],
                                        [Color.White, Color.Category10[i]],
                                        ustiles, i);
            }

            return derivedBuffer;
        });

        let outputImage = new Image(width, height);
        let hatchingSize = jquery("#slider1c1").slider("option", "value")

        for(let tile of ustiles) {
            for(let i in derivedBuffers) {
               if (jquery("#compo1c1c option:selected").text()=='Color')
                   derivedBuffers[i].color = derivedBuffers[i].colorScale.map(tile.dataValues[i]);
               else
                  derivedBuffers[i].color = Color.Category10[i];
                derivedBuffers[i].angle = 0;
            }
            let propWidth = false;

             if (jquery("#compo1c1d option:selected").text()=='Width')
                 propWidth = true;

             if (jquery("#compo1c1f option:selected").text()=="Align")
                 derivedBuffers.forEach((buffer) => { buffer.angle = Math.PI*parseInt(jquery("#compo1c1e option:selected").text())/180; })
             else
                 derivedBuffers.forEach((buffer, i) => { buffer.angle = Math.PI * i / 8; })

            outputImage.render(
                Composer.hatch(tile, derivedBuffers, hatchingSize, propWidth),
                tile.center
            );
        }

        CanvasRenderer.render(outputImage, 'fig1c1');
        if(d3.select("#border1c1").property("checked"))
          for(let tile of ustiles)
            CanvasRenderer.strokeVectorMask(tile.mask, 'fig1c1');
    }

    figure1c2(config:Parser.Configuration, topous:any) {
        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;

        let dataBuffers = config.data!.dataSpec!.buffers!.map((bufferSpec, i) => new DataBuffer(bufferSpec.value, width, height, bufferSpec.data));
        let size = 16;

        let tiles = Tiling.rectangularTiling(width, height, size, size);

        for(let tile of tiles) {
            tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
        }

        let maxCount = util.amax(tiles.map(tile => util.amax(tile.dataValues)));

        let derivedBuffers = this.dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            derivedBuffer.color = Color.Category10[i];

            return derivedBuffer;
        });

        let outputImage = new Image(width, height);
        let promises = [];

        for(let tile of tiles) {
            let promise = Composer.punchcard(derivedBuffers, tile.dataValues, {
                width: size,
                height: size,
                'z.scale.domain': [0, maxCount * 5],
                'z.scale.type': 'linear'
            }).then((vegaPixels) => {
                outputImage.render(vegaPixels, tile);
            })

            promises.push(promise);
        }

      Promise.all(promises).then(() => {
        let geo = config.getGeo();
        let ustiles = Tiling.topojsonTiling(width, height, topous, topous.objects.states,
                                            geo.projection, geo.latitudes, geo.longitudes);
        let canvas = document.getElementById('fig1c2')! as HTMLCanvasElement;
        canvas.width = width;
        canvas.height = height;

        for(let tile of ustiles)
          CanvasRenderer.strokeVectorMask(tile.mask, 'fig1c2');

        CanvasRenderer.render(outputImage, 'fig1c2', {
          blendingMode: CanvasRenderer.BlendingMode.Alpha,
          noResetDims: true
        });
      });
    }

    figure1e(config:Parser.Configuration, topous:any, update:boolean=false) {
          let me = this;
          let savedConfig = config;
          let savedTopous = topous;
          if (!update){
            jquery( "#slider1e" ).css("background", "#ddd").slider({
                min:   1,
                value: 4,
                max:   16,
                change:function( event:any, ui:any){me.figure1e(savedConfig, savedTopous, true);}
              }
            );
            jquery("#compo1ea").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
            jquery("#compo1eb").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
            jquery("#compo1ec").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
            jquery("#compo1ed").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
            jquery("#compo1ee").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
            jquery("#compo1ef").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
            jquery("#border1e").change(function(){ me.figure1e(savedConfig, savedTopous, true);});
        }

        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;

        let dataBuffers = config.data!.dataSpec!.buffers!.map((bufferSpec, i) => new DataBuffer(bufferSpec.value, width, height, bufferSpec.data));
        let geo = config.getGeo();
      let ustiles = Tiling.topojsonTiling(width, height, topous, topous.objects.states,
                                          geo.projection, geo.latitudes, geo.longitudes);

        let weavingSize = jquery("#slider1e").slider("option", "value");
        let randomMasks = Mask.generateWeavingRandomMasks(dataBuffers.length, weavingSize, width!, height!);

        let aggreg =jquery("#compo1ea option:selected").text();
        for(let tile of ustiles) {
          if (aggreg=='Min')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Min);
           else if (aggreg=='Sum')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
           else if (aggreg=='Mean')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Mean);
           else if (aggreg=='Max')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Max);
        }

        let maxCount = util.amax(ustiles.map(tile => util.amax(tile.dataValues)));

        let colscale =jquery("#compo1eb option:selected").text();
        let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            if (colscale=="Linear")
                 derivedBuffer.colorScale = new Scale.LinearColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
             else if (colscale=="Log")
                 derivedBuffer.colorScale = new Scale.LogColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
             else if (colscale=="CubicRoot")
                derivedBuffer.colorScale = new Scale.CubicRootColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
             else if (colscale=="SquareRoot")
                 derivedBuffer.colorScale = new Scale.SquareRootColorScale([1, maxCount], [Color.White, Color.Category10[i]]);
            else if (colscale=="EquiDepth") {
                createEquiDepthColormap(derivedBuffer,
                                        [0, maxCount],
                                        [Color.White, Color.Category10[i]],
                                        ustiles, i);
            }

            derivedBuffer.mask       = randomMasks[i];

            return derivedBuffer;
        });

        let outputImage = new Image(width, height);

        for(let tile of ustiles) {
        derivedBuffers.forEach((derivedBuffer, i) => {
            let color  = derivedBuffers[i].colorScale.map(tile.dataValues[i]);
            outputImage.render(color, tile, derivedBuffers[i].mask);
        });
        }

        CanvasRenderer.render(outputImage, 'fig1e');

        if(d3.select("#border1e").property("checked"))
          for(let tile of ustiles)
            CanvasRenderer.strokeVectorMask(tile.mask, 'fig1e');
    }

    figure1f(config:Parser.Configuration, topous:any, update:boolean=false) {
          let me = this;
          let savedConfig = config;
          let savedTopous = topous;
          if (!update){
            jquery( "#slider1f" ).css("background", "#ddd").slider({
                min:   10,
                value: 20,
                max:   100,
                change:function( event:any, ui:any){me.figure1f(savedConfig, savedTopous, true);}
              }
            );
            jquery("#compo1fa").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
            jquery("#compo1fb").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
            jquery("#compo1fc").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
            jquery("#compo1fd").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
            jquery("#compo1fe").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
            jquery("#compo1ff").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
            jquery("#border1f").change(function(){ me.figure1f(savedConfig, savedTopous, true);});
        }

        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;
        let histoSize = jquery("#slider1f").slider("option", "value");

        let dataBuffers = config.data!.dataSpec!.buffers!.map((bufferSpec, i) => new DataBuffer(bufferSpec.value, width, height, bufferSpec.data));

        let geo = config.getGeo();
        let ustiles = Tiling.topojsonTiling(width, height, topous, topous.objects.states,
                                            geo.projection, geo.latitudes, geo.longitudes);

        let aggreg =jquery("#compo1fa option:selected").text();
        for(let tile of ustiles) {
            if (aggreg=='Min')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Min);
           else if (aggreg=='Sum')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
           else if (aggreg=='Mean')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Mean);
           else if (aggreg=='Max')
               tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Max);
        }

        let maxCount = util.amax(ustiles.map(tile => util.amax(tile.dataValues)));


        let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
            let db = new DerivedBuffer(dataBuffer);
            db.color = Color.Category10[i];
            return db;
        })

        let outputImage = new Image(width, height);
        let promises = [];
        for(let tile of ustiles) {
            if(tile.mask.width < 30 || tile.mask.height < 30) continue;

            let promise = Composer.bars(derivedBuffers, tile.dataValues, {
                width: histoSize*0.8,
                height: histoSize,
                'y.scale.domain': [1, maxCount],
                'y.scale.type': 'sqrt'
            }).then((vegaPixels) => {
                outputImage.render(vegaPixels, tile);
            })

            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            let canvas = document.getElementById('fig1f')! as HTMLCanvasElement;
            canvas.width = width;
            canvas.height = height;

            if(d3.select("#border1f").property("checked"))
              for(let tile of ustiles)
                CanvasRenderer.strokeVectorMask(tile.mask, 'fig1f');

            CanvasRenderer.render(outputImage, 'fig1f', {
                blendingMode: CanvasRenderer.BlendingMode.Alpha,
                noResetDims: true
            });
        });
    }


    figure1g(config:Parser.Configuration, topous:any, update:boolean=false) {
       let me = this;
        let savedConfig = config;
        let savedTopous = topous;
        if (!update){
            jquery( "#slider1g" ).css("background", "#ddd").slider({
                min:   0,
                value: 8,
                max:   16,
                change:function( event:any, ui:any){me.figure1g(savedConfig, savedTopous, true);}
              }
            );
            jquery("#compo1ga").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
            jquery("#compo1gb").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
            jquery("#compo1gc").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
            jquery("#compo1gd").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
            jquery("#compo1ge").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
            jquery("#compo1gf").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
            jquery("#border1g").change(function(){ me.figure1g(savedConfig, savedTopous, true);});
        }

        let width  = config.data!.dataSpec!.encoding!.x!.bin!.maxbins!;
        let height = config.data!.dataSpec!.encoding!.y!.bin!.maxbins!;

        let size = 1;
        let blurSize = jquery("#slider1g").slider("option", "value");

        let dataBuffers = config.data!.dataSpec!.buffers!.slice(0, parseInt(jquery("#compo1gc option:selected").text())).map((bufferSpec) =>
            new DataBuffer(bufferSpec.value, width, height, bufferSpec.data).blur(blurSize).makeContour(12)
        );

        let tiles = Tiling.rectangularTiling(width, height, size, size);

        let aggreg =jquery("#compo1ga option:selected").text();
        for(let i in tiles) {
          let tile = tiles[i];
          // tile.dataValues are an array of numbers
          if (aggreg=='Min')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Min);
          else if (aggreg=='Sum')
             tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Sum);
          else if (aggreg=='Mean')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Mean);
          else if (aggreg=='Max')
              tile.dataValues = tile.aggregate(dataBuffers, TileAggregation.Max);
        }

        // get max count of bins for scale
        let maxCount = util.amax(tiles.map(tile => util.amax(tile.dataValues)));

        let svg = d3.select("#legend1g-legend");
        svg.selectAll("*").remove();

        let colscale =jquery("#compo1gb option:selected").text();
        let derivedBuffers = dataBuffers.map((dataBuffer, i) => {
            let derivedBuffer = new DerivedBuffer(dataBuffer);

            if (colscale=="Linear")
                derivedBuffer.colorScale = new Scale.LinearColorScale    ([0, maxCount], [Color.Category10[i].brighter(), Color.Category10[i].darker()]);
            else if (colscale=="Log")
                derivedBuffer.colorScale = new Scale.LogColorScale       ([0, maxCount], [Color.Category10[i].brighter(), Color.Category10[i].darker()]);
            else if (colscale=="CubicRoot")
               derivedBuffer.colorScale = new Scale.CubicRootColorScale  ([0, maxCount], [Color.Category10[i].brighter(), Color.Category10[i].darker()]);
            else if (colscale=="SquareRoot")
                derivedBuffer.colorScale = new Scale.SquareRootColorScale([0, maxCount], [Color.Category10[i].brighter(), Color.Category10[i].darker()]);
            else if (colscale=="EquiDepth"){
                createEquiDepthColormap(derivedBuffer,
                                        [0, maxCount],
                                        [Color.Category10a[i].brighter(),
                                         Color.Category10a[i].darker()],
                                        tiles, i);
            }

            for (let k=0; k<8; k++){
              let col = derivedBuffer.colorScale.map(k*maxCount/7);
              svg.append("circle")
                .attr("fill", col.css())
                .attr("r", 10)
                .attr("cx", ""+(110-i*20))
                .attr("cy", ""+(50-k*5));
            }

            svg.append("text")
              .attr("fill", "black")
              .attr("x", ""+(105-i*20))
              .attr("y", "50")
              .text(dataBuffer.name);


            return derivedBuffer;
        });

        let outputImage = new Image(width, height);

        for(let tile of tiles) {
            let color1 = Composer.mean(derivedBuffers, tile.dataValues);
            outputImage.render(color1, tile);
        }

        CanvasRenderer.render(outputImage, 'fig1g');

        let geo = config.getGeo();
        let ustiles = Tiling.topojsonTiling(width, height, topous, topous.objects.states,
                                            geo.projection, geo.latitudes, geo.longitudes);

        if(d3.select("#border1g").property("checked"))
          for(let tile of ustiles)
            CanvasRenderer.strokeVectorMask(tile.mask, 'fig1g', {color:'#000'});

    }
}

function createEquiDepthColormap(derivedBuffer:DerivedBuffer,
                                 domain:[number, number],
                                 colorRange:[Color, Color],
                                 tiles:Tile[], i:number) {
    let colorScale = new Scale.EquiDepthColorScale(domain, colorRange);
    let eds = colorScale.scale();
    for (let tile of tiles)
        eds.addPoint(tile.dataValues[i]);
    derivedBuffer.colorScale = colorScale;
}

export { default as extract } from './vega-extractor';

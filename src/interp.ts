// Interpreter from a parsed specification

import * as Parser from './parser';
import DataBuffer from './data-buffer';
import CanvasRenderer from './canvas-renderer';
import Image from './image';
import * as Tiling from './tiling';
import Tile from './tile';
import Color from './color';


export default class Interpreter {
    public width: number;
    public height: number;
    public n:number = 0;
    public dataBuffers:DataBuffer[] = [];
    public image:Image;
    public tiling:Tile[] = [];
    public strokeCanvas:boolean = false;
    public backgroundStroke = "grey";
    public fillCanvas:boolean = true;
    public background = "white";
    public bufferNames:string[];
    public colors:Color[] = Color.Category10;
    public labels:Map<string,string>;
    public rebin:any;

    constructor(public configuration:Parser.Configuration) {
        if (! configuration.validate())
            throw "Invalid configuration";
        this.width = configuration.width!;
        this.height = configuration.height!;
        this.image = new Image(this.width, this.height);
        this.bufferNames = configuration.bufferNames;
        this.dataBuffers = configuration.getBuffers();
        this.labels = configuration.getLabels();
        let colormap = configuration.getColors();
        if (colormap.length >= this.bufferNames.length)
            this.colors = colormap.map((name)=>Color.byName(name));
        else if (colormap.length != 0) {
            console.log('Not enough colors in colormap, ignored');
        }
        this.rebin = configuration.rebin;
    }

    public interpret(context={}) {
        this.computeDerivedBuffers(context);
        this.computeReencoding(context);
    }

    computeDerivedBuffers(context={}) {
    }

    computeRebin(context={}) {
        var tiling = this.tiling;
        if (! this.rebin || this.rebin.type=="none") {
            console.log('No rebin');
            tiling = Tiling.pixelTiling(this.width,
                                        this.height);
        }
        else if (this.rebin.type == "square") {
            let size = this.rebin.size || 10;
            console.log('Square rebin size='+size);
            tiling = Tiling.rectangularTiling(this.width,
                                              this.height,
                                              size, size);
        }
        else if (this.rebin.type == "rect") {
            let width = this.rebin.width || 10,
                height = this.rebin.height || 10;
            console.log('Square rebin w='+width+' h='+height);
            tiling = Tiling.rectangularTiling(this.width,
                                              this.height,
                                              width, height);
        }
        else if (this.rebin.type == "topojson") {
            let url = this.rebin.url,
                feature = this.rebin.feature || null;
            console.log('topojson rebin url='+url
                        +' feature='+feature);
            // TODO get the projection, transform, clip, etc.
            tiling = Tiling.topojsonTiling(this.width,
                                           this.height,
                                           feature);
        }
        else if (this.rebin.type == "voronoi") {
            let points = this.rebin.sites || 4;
            console.log('voronoi rebin sites='+points);
            tiling = Tiling.voronoiTiling(this.width,
                                          this.height,
                                          points);
        }
        this.tiling = tiling;
    }

    computeReencoding(context={}) {
    }
    
    render(id:string) {
        let ctx = CanvasRenderer.render(this.image, id);
        if (this.strokeCanvas) {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
            ctx.strokeStyle = this.backgroundStroke;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, this.width, this.height);
        }
    }

}

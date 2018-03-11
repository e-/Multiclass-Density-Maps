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
    }

    public interpret(context={}) {
        this.computeDerivedBuffers(context);
        this.computeReencoding(context);
    }

    computeDerivedBuffers(context={}) {
    }

    computeReencoding(context={}) {

    }

    render(id:string) {
        //CanvasRenderer.render(image, id);
        let ctx = CanvasRenderer.render(this.image, id);
        if (this.strokeCanvas) {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
            ctx.strokeStyle = this.backgroundStroke;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, this.width, this.height);
        }
    }

}

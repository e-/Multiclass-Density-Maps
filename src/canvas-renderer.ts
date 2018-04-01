import Image from './image';
import Mask from './mask';
import {arange} from './util';
import * as d3a from 'd3-array';
import * as d3s from 'd3-selection';

export enum BlendingMode {
    Normal = 0,
    Alpha
}

export default class CanvasRenderer {
    static BlendingMode = BlendingMode;

    static renderAll(images:Image[], canvas:string|HTMLCanvasElement,
                     order?: number[],
                     options: {
                         blur?:number,
                         blendingMode?:BlendingMode,
                         noResetDims?:boolean,
                         rows?:number,
                         cols?:number,
                         interval?:number
                     } = {}): CanvasRenderingContext2D {
        if (images.length == 1)
            return CanvasRenderer.render(images[0], canvas, options);
        else if (order && order.length == 1 && order[0] < images.length)
            return CanvasRenderer.render(images[order[0]], canvas, options);
        else if (options.interval)
            return CanvasRenderer.renderTimeMultiplexing(images, canvas as string, options.interval!);
        else
            return CanvasRenderer.renderMultiples(images, canvas, order, options);
    }

    static render(image:Image, id:string|HTMLCanvasElement, options:{
            blur?:number,
            blendingMode?:BlendingMode,
            noResetDims?:boolean
        } = {}
    ) : CanvasRenderingContext2D {
        let canvas = id instanceof HTMLCanvasElement ? id :
              document.getElementById(id) as HTMLCanvasElement;

        // After somthing drawn, changing the dimension of a canvas seems to reset all pixels.
        // For blending, set options.noResetDims to true.
        if(!options.noResetDims) {
            canvas.width   = image.width;
            canvas.height  = image.height;
        }
        let ctx:CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        if(!options.noResetDims) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (image.imageCanvas){
            ctx.drawImage(image.imageCanvas, 0, 0);
        }else {
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if(!options.blendingMode ||
               options.blendingMode as BlendingMode === BlendingMode.Normal) {
                 this.renderToImageData(image, imageData);
            }
            else if(options.blendingMode as BlendingMode === BlendingMode.Alpha) {
            }

            ctx.putImageData(imageData, 0, 0);
        }

        return ctx;
    }

    static render2(image:Image, id:string|HTMLCanvasElement, options:{blur?:number} = {}) : CanvasRenderingContext2D { // return the context
        //console.log("render2 "+id+": "+image.width+"x"+image.height)
        let canvas = id instanceof HTMLCanvasElement ? id :
              document.getElementById(id) as HTMLCanvasElement;
        canvas.width   = image.width;
        canvas.height  = image.height;
        let ctx:CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

        ctx.drawImage(image.imageCanvas!, 0, 0);
        return ctx;
    }

    static renderToImageData(image:Image, imageData:ImageData) {
        let data = imageData.data;
        var i = 0;

        for (let r = 0; r < image.height; r++) {
            let row = image.pixels[r];
            for (let c = 0; c < image.width; c++) {
                let p = row[c],
                    a = p.a;
                if (a == 0) {
                    data[i++] = 0;
                    data[i++] = 0;
                    data[i++] = 0;
                    data[i++] = 0;
                }
                else if (a == 1) {
                    data[i++] = p.r * 255;
                    data[i++] = p.g * 255;
                    data[i++] = p.b * 255;
                    data[i++] = p.a * 255;
                }
                else {
                    data[i++] = p.r * 255;
                    data[i++] = p.g * 255;
                    data[i++] = p.b * 255;
                    data[i++] = p.a * 255;
                }
            }
        }
    }

    static renderAlphaBlending(image:Image, imageData:ImageData) {
        let data = imageData.data;
        var i = 0;

        for (let r = 0; r < image.height; r++) {
            for (let c = 0; c < image.width; c++) {
              let p = image.pixels[r][c],
                  a = p.a;
                if (a == 1) {
                    data[i + 0] = p.r;
                    data[i + 1] = p.g;
                    data[i + 2] = p.b;
                    data[i + 3] = 255;
                }
                else if (a != 0) {
                    data[i + 0] = p.r / a * 255 + data[i + 0] * (1 - a);
                    data[i + 1] = p.g / a * 255 + data[i + 1] * (1 - a);
                    data[i + 2] = p.b / a * 255 + data[i + 2] * (1 - a);
                    data[i + 3] = a * 255 + data[i + 3] * (1 - a);
                }
                i += 4;
            }
        }
    }

    static strokeVectorMask(mask:Mask|undefined, id:string|HTMLCanvasElement,
                            options:{ color?:string, lineWidth?:number} = {}){
      if (!mask || mask.path == undefined) return;
      //console.log("drawMask "+mask.pols.allpolys.length);

      let canvas = id instanceof HTMLCanvasElement ? id :
              document.getElementById(id) as HTMLCanvasElement;
      let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      ctx.beginPath();
      ctx.strokeStyle = options.color || '#000';
      ctx.lineWidth = options.lineWidth || 1;
      mask.path.send(ctx);
      ctx.stroke();
    }

    static renderTimeMultiplexing(images:Image[], id:string, interval:number) {
        let ctx:CanvasRenderingContext2D;
        let n = images.length;
        let ids = d3a.range(n).map(i => id.replace("{i}", i.toString()));
        images.forEach((image, i) => {
            ctx = CanvasRenderer.render(image, ids[i]);
        });

        let target = 0;
        d3s.select('#' + ids[0]).style('opacity', 1);
        for(let i = 1; i < n; ++i) {
            let canvas = d3s.select('#' + ids[i]).style('opacity', 0);
        }

        function repeat() {
            let hide = d3s.select('#' + ids[target]);
            let show = d3s.select('#' + ids[(target + 1) % n]);

            hide.transition().style('opacity', 0);
            show.transition().style('opacity', 1);

            target = (target + 1) % n;
        }

        setInterval(repeat, interval * 1000 * n);

        return ctx!; // TODO only returns the last one
    }

    static renderMultiples(images:Image[], id:string|HTMLCanvasElement,
                           order?: number[],
                           options:{rows?:number, cols?:number} = {}) {
        let len = (order!==undefined) ? order.length : images.length;
        if (order === undefined) {
            order = arange(len);
        }
        let rows = options.rows || 1;
        let cols = options.cols || 1;

        if(rows * cols < len) {
            rows = cols = Math.ceil(Math.sqrt(len));
        }

        let canvas = id instanceof HTMLCanvasElement ? id :
              document.getElementById(id) as HTMLCanvasElement;
        let width = images[0].width,
            height = images[0].height;

        //let canvas:any = document.getElementById(id);
        canvas.width   = width ;
        canvas.height  = height ;

        let ctx:CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

        let memoryCanvas:any = document.createElement('canvas');
        memoryCanvas.width = width;
        memoryCanvas.height = height;
        let memoryCtx:CanvasRenderingContext2D = memoryCanvas.getContext('2d') as CanvasRenderingContext2D;
        let imageData = memoryCtx.getImageData(0, 0, width, height);
        let mWidth = width / cols;
        let mHeight = height / rows;

        images.forEach((image, i) => {
            this.renderToImageData(image, imageData);

            memoryCtx.putImageData(imageData, 0, 0);

            let col = Math.floor(order![i] / rows);
            let row = order![i] % rows;
            ctx.drawImage(memoryCanvas, 0,           0,                         width,      height,
                                        width * col / cols, height * row /rows, width/cols, height/rows);
        });

        for (let r = 1; r < rows; r++) {
            let y = height*r/rows;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        for (let c = 1; c < cols; c++) {
            let x = width*c/cols;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.stroke();
        return ctx;
    }
}

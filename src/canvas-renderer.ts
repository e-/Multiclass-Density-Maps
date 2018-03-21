import Image from './image';
import Mask from './mask';

enum BlendingMode {
    Normal = 0,
    Alpha
}

export default class CanvasRenderer {
    static BlendingMode = BlendingMode;

    static renderAll(images:Image[], id:string,
                     select?: number,
                     options: {
                         blur?:number,
                         blendingMode?:BlendingMode,
                         noResetDims?:boolean,
                         rows?:number, cols?:number
                     } = {}): CanvasRenderingContext2D {
        if (images.length == 1)
            return CanvasRenderer.render(images[0], id, options);
        else if (select && select < images.length)
            return CanvasRenderer.render(images[select], id, options);
        else
            return CanvasRenderer.renderMultiples(images, id, options);
    }

    static render(image:Image, id:string, options:{
            blur?:number,
            blendingMode?:BlendingMode,
            noResetDims?:boolean
        } = {}
    ) : CanvasRenderingContext2D {
        let canvas:any = document.getElementById(id);

        // After somthing drawn, changing the dimension of a canvas seems to reset all pixels.
        // For blending, set options.noResetDims to true.
        if(!options.noResetDims) {
            canvas.width   = image.width;
            canvas.height  = image.height;
        }
        let ctx:CanvasRenderingContext2D = canvas.getContext('2d');
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

    static render2(image:Image, id:string, options:{blur?:number} = {}) : CanvasRenderingContext2D { // return the context
        //console.log("render2 "+id+": "+image.width+"x"+image.height)
        let canvas:any = document.getElementById(id);
        canvas.width   = image.width;
        canvas.height  = image.height;
        let ctx:CanvasRenderingContext2D = canvas.getContext('2d');

        ctx.drawImage(image.imageCanvas!, 0, 0);
        return ctx;
    }

    static renderToImageData(image:Image, imageData:ImageData) {
        let data = imageData.data;
        var i = 0;

        for (let r = 0; r < image.height; r++) {
            for (let c = 0; c < image.width; c++) {
                let p = image.pixels[r][c],
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

    static strokeVectorMask(mask:Mask|undefined, id:string, options:{
        color?:string,
        lineWidth?:number
    } = {}){
      if (!mask || mask.path == undefined) return;
      //console.log("drawMask "+mask.pols.allpolys.length);

      let canvas:any = document.getElementById(id);
      let ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.strokeStyle = options.color || '#000';
      ctx.lineWidth = options.lineWidth || 1;
      mask.path.send(ctx);
      ctx.stroke();
    }

    static renderMultiples(images:Image[], id:string, options:{rows?:number, cols?:number} = {}) {
        let rows = options.rows || 1;
        let cols = options.cols || 1;

        if(rows * cols < images.length) {
            rows = cols = Math.ceil(Math.sqrt(images.length));
        }

        let width = images[0].width,
            height = images[0].height;

        let canvas:any = document.getElementById(id);
        canvas.width   = width ;
        canvas.height  = height ;

        let ctx:CanvasRenderingContext2D = canvas.getContext('2d');

        let memoryCanvas:any = document.createElement('canvas');
        memoryCanvas.width = width;
        memoryCanvas.height = height;
        let memoryCtx:CanvasRenderingContext2D = memoryCanvas.getContext('2d');
        let imageData = memoryCtx.getImageData(0, 0, width, height);
        let mWidth = width / cols;
        let mHeight = height / rows;

        images.forEach((image, i) => {
            this.renderToImageData(image, imageData);

            memoryCtx.putImageData(imageData, 0, 0);

            let col = Math.floor(i / rows);
            let row = i % rows;
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

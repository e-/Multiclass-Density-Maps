import Image from './image';
import Mask from './mask';
import * as Polys2D from './polys2D';

enum BlendingMode {
    Normal = 0,
    Alpha
}

export default class CanvasRenderer {
    static BlendingMode = BlendingMode;

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
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if(!options.blendingMode || options.blendingMode as BlendingMode === BlendingMode.Normal) {
            this.renderToImageData(image, imageData);

        }
        else if(options.blendingMode as BlendingMode === BlendingMode.Alpha) {
            this.renderAlphaBlending(image, imageData);
            console.log(image);
        }

        ctx.putImageData(imageData, 0, 0);

        return ctx;
    }

    static render2(image:Image, id:string, options:{blur?:number} = {}) : CanvasRenderingContext2D { // return the context
        //console.log("render2 "+id+": "+image.width+"x"+image.height)
        let canvas:any = document.getElementById(id);
        canvas.width   = image.width;
        canvas.height  = image.height;
        let ctx:CanvasRenderingContext2D = canvas.getContext('2d');

        ctx.drawImage(image.imageCanvas, 0, 0);
        return ctx;
    }

    static renderToImageData(image:Image, imageData:ImageData) {
        let data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = Math.floor(i / 4 / image.width);
          let c = i / 4 % image.width;

          data[i + 0] = image.pixels[r][c].r * 255;
          data[i + 1] = image.pixels[r][c].g * 255;
          data[i + 2] = image.pixels[r][c].b * 255;
          data[i + 3] = image.pixels[r][c].a * 255;
        }
    }

    static renderAlphaBlending(image:Image, imageData:ImageData) {
        let data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = Math.floor(i / 4 / image.width);
            let c = i / 4 % image.width;
            let a = image.pixels[r][c].a;

            data[i + 0] = image.pixels[r][c].r * 255 * a + data[i + 0] * (1 - a);
            data[i + 1] = image.pixels[r][c].g * 255 * a + data[i + 1] * (1 - a);
            data[i + 2] = image.pixels[r][c].b * 255 * a + data[i + 2] * (1 - a);
            data[i + 3] = image.pixels[r][c].a * 255 * a + data[i + 3] * (1 - a);
        }
    }

    static strokeVectorMask(mask:Mask|undefined, id:string, color:string){
      if (!mask) return;
      //console.log("drawMask "+mask.pols.allpolys.length);

      let canvas:any = document.getElementById(id);
      let ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.strokeStyle = color;
      for (let j=0; j<mask.pols.allpolys.length; j++){
        let pol:any = mask.pols.allpolys[j];
        ctx.moveTo(pol.ptx[0], pol.pty[0]);
        for (let i=1; i<=pol.ptx.length; i++)
          ctx.lineTo(pol.ptx[i%pol.ptx.length], pol.pty[i%pol.ptx.length]);
      }
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

        //console.log(mWidth, mHeight);
        images.forEach((image, i) => {
            this.renderToImageData(image, imageData);

            memoryCtx.putImageData(imageData, 0, 0);

            let col = Math.floor(i / rows);
            let row = i % rows;
            ctx.drawImage(memoryCanvas, 0,           0,                         width,      height,
                                        width * col / cols, height * row /rows, width/cols, height/rows);
        })
    }
}

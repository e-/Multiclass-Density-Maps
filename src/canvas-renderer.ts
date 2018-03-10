import Image from './image';
import Mask from './mask';
import * as Polys2D from './polys2D';

export default class CanvasRenderer {

    static render(image:Image, id:string, options:{blur?:number} = {}) {
        let canvas:any = document.getElementById(id);
        canvas.width   = image.width;
        canvas.height  = image.height;

        let ctx:any = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        this.renderToImageData(image, imageData);

        // does not work when used with image data
        if(options.blur) ctx.filter = `blur(${options.blur}px`;

        ctx.putImageData(imageData, 0, 0);
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

    static drawVectorMask(mask:Mask|undefined, id:string){
      if (!mask) return;
      //console.log("drawMask "+mask.pols.allpolys.length);

      let canvas:any = document.getElementById(id);
      let ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.strokeStyle = '#000';
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
        canvas.width   = width * cols;
        canvas.height  = height * rows;

        let ctx:CanvasRenderingContext2D = canvas.getContext('2d');

        let memoryCanvas:any = document.createElement('canvas');
        memoryCanvas.width = width;
        memoryCanvas.height = height;
        let memoryCtx:CanvasRenderingContext2D = memoryCanvas.getContext('2d');
        let imageData = memoryCtx.getImageData(0, 0, width, height);
        let mWidth = width / cols;
        let mHeight = height / rows;

        console.log(mWidth, mHeight);
        images.forEach((image, i) => {
            this.renderToImageData(image, imageData);

            memoryCtx.putImageData(imageData, 0, 0);

            let col = Math.floor(i / rows);
            let row = i % rows;
            ctx.drawImage(memoryCanvas, 0, 0, width, height, width * col, height * row, width, height);
        })
    }
}

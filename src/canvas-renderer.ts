import Image from './image';
import Mask from './mask';
import * as Polys2D from './polys2D';

export default class CanvasRenderer {
    static render(image:Image, id:string) {
      //console.log(image.width+"x"+image.height)

      let canvas:any = document.getElementById(id);
      canvas.width   = image.width;
      canvas.height  = image.height;

      let ctx = canvas.getContext('2d');
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = Math.floor(i / 4 / image.width);
        let c = i / 4 % image.width;

        data[i + 0] = image.pixels[r][c].r * 255;
        data[i + 1] = image.pixels[r][c].g * 255;
        data[i + 2] = image.pixels[r][c].b * 255;
        data[i + 3] = image.pixels[r][c].a * 255;
      }

      ctx.putImageData(imageData, 0, 0);
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
}
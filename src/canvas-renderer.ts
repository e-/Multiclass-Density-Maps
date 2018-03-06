import Image from './image';

export default class CanvasRenderer {
    static render(image:Image, id:string) {
      console.log(image.width+"x"+image.height)

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

    static render2(image:Image, id:string) {
      console.log(image.width+"x"+image.height)

      let canvas:any = document.getElementById(id);
      canvas.width   = image.width;
      canvas.height  = image.height;

      let ctx = canvas.getContext('2d');
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = Math.floor(i / 4 / image.width);
        let c = i / 4 % image.width;
        if(c==100 && r==100) console.log(image.pixels[r][c].r+" "+image.pixels[r][c].g+" "+image.pixels[r][c].b+" "+image.pixels[r][c].a);

        data[i + 0] = image.pixels[r][c].r * 255;
        data[i + 1] = image.pixels[r][c].g * 255;
        data[i + 2] = image.pixels[r][c].b * 255;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    }
}
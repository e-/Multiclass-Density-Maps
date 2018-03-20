import * as util from './util';

export default class Mask {
    path?:Path2D;
    maskCanvas?:HTMLCanvasElement;
    mask:Uint8ClampedArray[];

    constructor(public width:number, public height:number,
                default_value:number = 1) {
        // public mask = util.create2D<number>(width, height, default_value)
        let buffer = new ArrayBuffer(width*height);
        this.mask = Array<Uint8ClampedArray>(height);
        for (let i = 0; i < height; i++) 
            this.mask[i] = new Uint8ClampedArray(buffer, i*width, width).fill(default_value);
    }

    getCanvas() {
        if (this.maskCanvas == undefined) {
            this.maskCanvas = <HTMLCanvasElement>document.createElement('canvas');
            this.maskCanvas.width  = this.width;
            this.maskCanvas.height = this.height;
        }
        return this.maskCanvas;
    }
  
    getPath() {
      if (this.path === undefined)
        this.path = new Path2D();
      return this.path;
    }

    copyFrom(imageData:ImageData) {
        for (let r = 0; r < imageData.height; r++) {
            for (let c = 0; c < imageData.width; c++) {
                if (imageData.data[c*4+r*4*imageData.width +3] > 0){
                    this.mask[r][c] = 1;
                }
            }
        }
    }

    static generateWeavingSquareMasks(m: number, size: number, width: number, height: number, xincr: number = 1) : Mask[]
    {
        let masks:Mask[] = Array<Mask>(m);
        let i:number, j:number;
        size = Math.floor(size);
        if (xincr < 0) {
            xincr = m + (xincr % m)
        }

        for (let i = 0; i < m; i++) {
            masks[i] = new Mask(width, height, 0);
        }
        for (let i = 0; i < (height/size); i++) {
            let row = i * size;
            let row_max = Math.min(row+size, height);
            for (let j = 0; j < (width/size); j++) {
                let col = j * size;
                let col_max = Math.min(col+size, width);
                let selected = (i*xincr + j);
                let mask = masks[selected%m];
                for (let r = row; r < row_max; r++) {
                    for (let c = col; c < col_max; c++) {
                        mask.mask[r][c] = 1;
                    }
                }
            }
        }
        return masks;
    }

    static generateWeavingHexaMasks(m: number, size: number, width: number, height: number, xincr: number = 1) : Mask[]
    {
        let masks:Mask[] = Array<Mask>(m);
        let i:number, j:number;
        size = Math.floor(size);

        if (xincr < 0) {
            xincr = m + (xincr % m)
        }

        for (let i = 0; i < m; i++) {
            masks[i] = new Mask(width, height, 0);
        }
        for (let j = 0; j < (height/size); j++) {
            for (let i = 0; i < (width/size); i++) {
                let col = i * size;
                let row = j * size;
                let selected = (i+(j*2)%8)%m;
                if (j%2==1) { // brick effect
                    col += size/2;
                }
                let mask   = masks[selected];
                let path   = mask.getPath();

                let y = 3*size/16;
                // 6 pts to make an hexagon
                path.moveTo(col,        row+y);
                path.lineTo(col+size/2, row-y);
                path.lineTo(col+size,   row+y);
                path.lineTo(col+size,   row+size-y);
                path.lineTo(col+size/2, row+size+y);
                path.lineTo(col,        row+size-y);
                path.closePath();
            }
        }
        masks.forEach(mask => {
            let ctx = <CanvasRenderingContext2D>mask.getCanvas().getContext("2d");
            ctx.fillStyle = "#111";
            ctx.fill(mask.getPath());
            let imageData =  ctx.getImageData(0, 0, mask.width, mask.height);
            let maskImage = new Uint8ClampedArray(mask.mask[0].buffer);
            for (let i = 0, j = 0; i < maskImage.length; i++, j+= 4) 
                maskImage[i] = imageData.data[j];
        });
        return masks;
    }

    static generateWeavingTriangleMasks(m: number, size: number, width: number, height: number) : Mask[]
    {
        //TODO (jdf) fix to work with any m or throw exception when m is odd??
        let masks:Mask[] = Array<Mask>(m);
        let i:number, j:number;
        size = Math.floor(size);

        for (let i = 0; i < m; i++) {
            masks[i] = new Mask(width, height, 0);
        }
        for (let j = 0; j <= (height/size); j++) {
            for (let i = 0; i < (width/size); i++) {

                //let selected = (((i-j%2) +(width/size)- j))%m;

                let selected = i%(m/2);
                if (j%2==1)
                  selected = i%(m/2)+m/2;

                let row = (j-1) * size;
                let col = (i-1) * size*1.5-(j%2)*(size*0.75);

                let mask   = masks[selected];
                let path   = mask.getPath();

                let y = 3*size/16;
                path.moveTo(col+0.75*0*size, col+0.75*2*size);
                path.lineTo(col+0.75*1*size, col+0.75*3*size);
                path.lineTo(col+0.75*2*size, col+0.75*4*size);
                path.closePath();

                path.moveTo(col+0.75*2*size,  row+size);
                path.lineTo(col+0.75*3*size, row+2*size);
                path.lineTo(col+0.75*4*size, row+size);
                path.closePath();

            }
        }
        masks.forEach(mask => {
            let ctx = <CanvasRenderingContext2D>mask.getCanvas().getContext("2d");
            ctx.fillStyle = "#111";
            ctx.fill(mask.getPath());
            let imageData =  ctx.getImageData(0, 0, mask.width, mask.height);
            let maskImage = new Uint8ClampedArray(mask.mask[0].buffer);
            for (let i = 0, j = 0; i < maskImage.length; i++, j+= 4) 
                maskImage[i] = imageData.data[j];
        });
        return masks;
    }

    static generateWeavingRandomMasks(m: number, size: number, width: number, height: number) : Mask[]
    {
        let masks:Mask[] = Array<Mask>(m);
        size = Math.floor(size);

        for (let i = 0; i < m; i++) {
            masks[i] = new Mask(width, height, 0);
        }

        for (let row = 0; row < height; row += size) {
            let row_max = Math.min(row+size, height);
            for (let col = 0; col < width; col += size) {
                let col_max = Math.min(col+size, width);
                let selected = Math.floor(Math.random() * m);
                let mask = masks[selected];
                for (let r = row; r < row_max; r++) {
                    for (let c = col; c < col_max; c++) {
                        mask.mask[r][c] = 1;
                    }
                }
            }
        }
        return masks;
    }
}

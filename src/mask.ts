import * as util from './util';
import Polys2D from './polys2D'

export default class Mask {
    path:Path2D = new Path2D();
    pols:Polys2D = new Polys2D("shape");
    maskCanvas?:HTMLCanvasElement;
    mask:Uint8Array[];

    constructor(public width:number, public height:number,
                default_value:number = 1) {
        // public mask = util.create2D<number>(width, height, default_value)
        let buffer = new ArrayBuffer(width*height);
        this.mask = Array<Uint8Array>(height);
        for (let i = 0; i < height; i++) 
            this.mask[i] = new Uint8Array(buffer, i*width, width).fill(default_value);
    }

    getCanvas() {
        if (this.maskCanvas == undefined) {
            this.maskCanvas = <HTMLCanvasElement>document.createElement('canvas');
            this.maskCanvas.width  = this.width;
            this.maskCanvas.height = this.height;
        }
        return this.maskCanvas;
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
                mask.path.rect(row, col, size, size);
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
                let ctx    = mask.getCanvas().getContext("2d");
                let pixels = ctx!.getImageData(0, 0, mask.width, mask.height);

                let y = 3*size/16;
                // 6 pts to make an hexagon
                mask.pols.addPoly([col,   col+size/2, col+size, col+size,   col+size/2, col],
                                  [row+y, row-y,      row+y,    row+size-y, row+size+y, row+size-y]);

                let row_min = Math.max(row-Math.ceil(y), 0);
                let row_max = Math.min(row+size+Math.ceil(y), height);
                let col_max = Math.min(col+size, width);
                for (let r = row_min; r < row_max; r++) {
                    for (let c = col; c < col_max; c++) {
                        if (mask.pols.isPointInPoly(-1, c, r)){
                          mask.mask[r][c] = 1;
                          pixels.data[c*4+r*4*mask.width +0] = 255;
                          pixels.data[c*4+r*4*mask.width +1] = 255;
                          pixels.data[c*4+r*4*mask.width +2] = 255;
                          pixels.data[c*4+r*4*mask.width +3] = 255;
                        }
                    }
                }
                ctx!.putImageData(pixels, 0, 0);
            }
        }
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
                let ctx    = mask.getCanvas().getContext("2d");
                let pixels = ctx!.getImageData(0, 0, mask.width, mask.height);

                let y = 3*size/16;
                // 2*3 pts to make 2 triangles
                {
                    mask.pols.addPoly([col+0.75*0*size,  col+0.75*1*size, col+0.75*2*size],
                                      [row+size,         row,             row+size]);
                    mask.pols.addPoly([col+0.75*2*size,  col+0.75*3*size, col+0.75*4*size],
                                      [row+size,         row+2*size,      row+size]);
                }

                let row_min = Math.max(row, 0);
                let row_max = Math.min(row+2*size, height-1);
                let col_max = Math.min(col+3*size,  width-1);
                for (let r = row_min; r <= row_max; r++) {
                    for (let c = col; c <= col_max; c++) {
                        if (mask.pols.isPointInPoly(-1, c, r) || mask.pols.isPointInPoly(-2, c, r)){
                          mask.mask[r][c] = 1;
                          pixels.data[c*4+r*4*mask.width +0] = 255;
                          pixels.data[c*4+r*4*mask.width +1] = 255;
                          pixels.data[c*4+r*4*mask.width +2] = 255;
                          pixels.data[c*4+r*4*mask.width +3] = 255;
                        }
                    }
                }
                ctx!.putImageData(pixels, 0, 0);
            }
        }
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
                mask.path.rect(row, col, size, size);
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

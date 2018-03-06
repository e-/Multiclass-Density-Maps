import * as util from './util';
import Polys2D from './fred-test'

export default class Mask {
    path:Path2D = new Path2D();
    pols:Polys2D = new Polys2D("shape");

    constructor(public width:number, public height:number,
                default_value:number = 1,
                public mask:number[][] = util.create2D<number>(width, height, default_value)) {
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
        console.log("generateWeavingHexaMasks "+m+" "+size);
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
                let selected = (i*xincr +(width/size)- j);
                let mask = masks[selected%m];
                mask.path.rect(row, col, size, size);
                mask.pols.addPoly([row, row+size, row+size, row], [col, col, col+size, col+size]);
                //mask.path.moveTo(row, col);
                //mask.path.lineTo(row+size, col);
                //mask.path.lineTo(row+size, col+size);
                //mask.path.lineTo(row,      col+size);
                //mask.path.lineTo(row,      col);
                //mask.path.closePath();
                //console.log(row+" "+col+" "+size);
                for (let r = row; r < row_max; r++) {
                    for (let c = col; c < col_max; c++) {
                        mask.mask[r][c] = 1;
                    }
                }
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

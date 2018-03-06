// compile/transpile with tsc src/fred-test.ts --outfile dist/fred-test.js

// found pngjs here :
// https://www.npmjs.com/package/pngjs
// found types for this lib here :
// https://www.npmjs.com/package/@types/pngjs

import * as PNG from "pngjs";

class Poly {
  ptx:number[]=[];
  pty:number[]=[];
}

export default class Polys2D {
    public nbpolys: number =0;
    allpolys:Poly[]=[];

    constructor(public name: string) {
    }

    addPoly(ptx:number[], pty:number[]){
      let pol:Poly = new Poly();
      pol.ptx = ptx;
      pol.pty = pty;
      this.allpolys.push(pol);
    }

    isPointInPolys(x:number, y:number){
      // inspired from
      //+ Jonas Raoni Soares Silva
      //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

      //console.log("isPointInPoly "+pt.x+","+pt.y);
      let res:boolean=false;
      for (let k in this.allpolys){
        let poly:Poly = this.allpolys[k];
        let i:number = -1;
        let l:number = poly.ptx.length;
        let j:number = l - 1;
        for(; ++i < l; j = i){
          ((poly.pty[i] <= y && y < poly.pty[j]) || (poly.pty[j] <= y && y < poly.pty[i]))
          && (x < (poly.ptx[j] - poly.ptx[i]) * (y - poly.pty[i]) / (poly.pty[j] - poly.pty[i]) + poly.ptx[i])
          && (res = !res);
        }
      }
      return res;
    }
}


interface Person {
    firstName: string;
    lastName: string;
}






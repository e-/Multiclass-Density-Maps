

export class Poly {
  ptx:number[]=[];
  pty:number[]=[];
}

export default class Polys2D {
    public nbpolys: number =0;
    public allpolys:Poly[]=[];

    constructor(public name: string) {
    }

    addPoly(ptx:number[], pty:number[]){
      let pol:Poly = new Poly();
      pol.ptx = ptx;
      pol.pty = pty;
      this.allpolys.push(pol);
    }

    isPointInPolys(x:number, y:number):boolean{
      // inspired from
      //+ Jonas Raoni Soares Silva
      //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

      //console.log("isPointInPoly "+pt.x+","+pt.y);
      let res:boolean=false;
      for(let k = 0;k<this.allpolys.length;k++) {
        res = res || this.isPointInPoly(k, x, y);
      }
      return res;
    }

    isPointInPoly(k0:number, x:number, y:number):boolean{
      // inspired from
      //+ Jonas Raoni Soares Silva
      //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

      //console.log("isPointInPoly "+pt.x+","+pt.y);
      let k:number =k0;
      if (k0<0 && k0>=-this.allpolys.length)
        k = this.allpolys.length+k;

      let res:boolean=false;
      let poly:Poly = this.allpolys[k];
      //if (!poly)
      //  console.log(k0+" => "+k+". len="+this.allpolys.length);
      let i:number = -1;
      let l:number = poly.ptx.length;
      let j:number = l - 1;
      for(; ++i < l; j = i){
        ((poly.pty[i] <= y && y < poly.pty[j]) || (poly.pty[j] <= y && y < poly.pty[i]))
        && (x < (poly.ptx[j] - poly.ptx[i]) * (y - poly.pty[i]) / (poly.pty[j] - poly.pty[i]) + poly.ptx[i])
        && (res = !res);
      }

      return res;
    }
}


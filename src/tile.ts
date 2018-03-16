import Point from './point';
import DataBuffer from './data-buffer';
import Mask from './mask';
import Color from './color';

export enum TileAggregation {
    Min,
    Mean,
    Sum,
    Max
}

export default class Tile extends Point {
    dataValues:number[] = [];
    id:number = -1

    constructor(x:number, y:number, public mask:Mask) {
      super(x, y);
    }

    aggregateOne(buffer:DataBuffer, op:TileAggregation = TileAggregation.Mean): number {
        let val = 0;
        let cnt = 0;

        for(let r = Math.ceil(this.y); r < this.y + this.mask.height; r++) {
            if(r >= buffer.height) break;
            if (!buffer.values[r]) continue;
            for(let c = Math.ceil(this.x); c < this.x + this.mask.width; c++) {
                if(c >= buffer.width) break;
                if (this.mask.mask && this.mask.mask[r-Math.ceil(this.y)][c-Math.ceil(this.x)] == 0) continue;
                if(cnt == 0)
                    val = buffer.values[r][c];
                else {
                    let current = buffer.values[r][c];
                    switch(op) {
                    case TileAggregation.Min:
                        val = Math.min(val, current);
                        break;
                    case TileAggregation.Mean:
                    case TileAggregation.Sum:
                        val += current;
                        break;
                    case TileAggregation.Max:
                        val = Math.max(val, current);
                        break;
                    }
                }
                cnt ++;
            }
        }

        if(op === TileAggregation.Mean && cnt > 0) {
            val /= cnt;
        }

        return val;
    }


    aggregate(buffers:DataBuffer[], op:TileAggregation = TileAggregation.Mean):number[] {
      // Just one thing to aggregate ? let's return it
      if (this.mask.height==1 && this.mask.width==1)
        return buffers.map(buffer => buffer.values[Math.ceil(this.y)][Math.ceil(this.x)]);
      else
        return buffers.map(buffer => this.aggregateOne(buffer, op));
    }

    center() {
        return new Point(this.x+this.mask.width/2, this.y+this.mask.height/2)
    }

}

import Point from './point';
import DataBuffer from './data-buffer';
import Mask from './mask';

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
        for(let c = Math.ceil(this.x); c < this.x + this.mask.width; c++) {
          if(c >= buffer.width) break;
          if (!buffer.values[r]) console.log(this.y+" < "+r+" < "+this.y + this.mask.height);
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
        return buffers.map(buffer => this.aggregateOne(buffer, op));
    }
  }

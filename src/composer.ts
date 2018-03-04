import DataBuffer from './data-buffer';
import Color from './color';

export default class Composer {
    static max(buffers:DataBuffer[], bufferValues:number[]):Color {
        let best = bufferValues[0];
        let bestIndex = 0;
    
        bufferValues.forEach((bufferValue, i) => {
          if(bufferValue > best) {
            best = bufferValue;
            bestIndex = i;
          }
        });
    
        return buffers[bestIndex].color.whiten(best);
    }
    
    static mix(buffers:DataBuffer[], bufferValues:number[]):Color {
        let sum = 0;
        let ret = new Color(0, 0, 0, 1);
    
        bufferValues.forEach((bufferValue, i) => {
          sum += bufferValue;
          ret = ret.add(buffers[i].color.whiten(bufferValue));
        });
    
        if(sum > 0)
          ret = ret.dissolve(1 / buffers.length); // TODO: is this correct?
    
        return ret;
    }
}
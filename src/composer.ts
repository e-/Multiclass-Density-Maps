import DerivedBuffer from './derived-buffer';
import Color from './color';
import { ScaleTrait } from './scale';

export default class Composer {
    static max(buffers:DerivedBuffer[], values:number[]):Color {
        let best = values[0];
        let bestIndex = 0;

        values.forEach((value, i) => {
          if(value > best) {
            best = value;
            bestIndex = i;
          }
        });

        return buffers[bestIndex].colorScale.map(best);
    }

    // static mix(buffers:DerivedBuffer[], bufferValues:number[]):Color {
    //     let sum = 0;
    //     let ret = new Color(0, 0, 0, 1);

    //     bufferValues.forEach((bufferValue, i) => {
    //       sum += bufferValue;
    //       ret = ret.add(buffers[i].color.whiten(bufferValue));
    //     });

    //     if(sum > 0)
    //       ret = ret.dissolve(1 / buffers.length); // TODO: is this correct?

    //     return ret;
    // }
}

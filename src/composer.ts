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

    static mean(buffers:DerivedBuffer[], values:number[]):Color {
        let sum = 0;
        let ret = new Color(0, 0, 0, 0);

        values.forEach((value, i) => {
          sum += value;
          ret = ret.add(buffers[i].colorScale.map(value).dissolve(value));
        });

        if(sum > 0)
          ret = ret.dissolve(1 / sum); // TODO: is this correct?

        return ret;
    }

    static additiveMix(buffers:DerivedBuffer[], values:number[]):Color {
        let sum = 0;
        let ret = new Color(0, 0, 0, 1);

        values.forEach((value, i) => {
          ret = ret.add(buffers[i].colorScale.map(value));
        });

        ret = ret.clamp();
        return ret;
    }
}

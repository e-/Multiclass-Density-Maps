import DerivedBuffer from './derived-buffer';
import Color from './color';
import { ScaleTrait } from './scale';
import extract from './vega-extractor'

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

    static one(buffer:DerivedBuffer, value:number):Color {
        return buffer.colorScale.map(value);
    }

    static bars(buffers:DerivedBuffer[], values:number[],
        options:{
            width?:number,
            height?:number,
            'y.scale.domain': [number, number],
            'y.scale.type'?: string
        } = {'y.scale.domain': [0, 1], 'y.scale.type': 'linear'}
    ) {
        let spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
            data: {
                values: buffers.map((buffer, i) => {return {name: buffer.originalDataBuffer.name, value: values[i]}})
            },
            mark: "bar",
            encoding: {
                x: {field: "name", type: "ordinal"},
                y: {
                    field: "value",
                    "type": "quantitative",
                    scale: {
                        domain: options['y.scale.domain'],
                        type: options['y.scale.type']
                    }
                }
            },
            autosize: "none",
            config: {
                group: {
                    strokeWidth: 0
                },
                axis: {
                    ticks: false,
                    labels: false,
                    //domain: false,
                    grid: false,
                    tickExtra: false,
                    gridColor: null
                }
            },
            width: options.width || 30,
            height: options.height || 30,
            padding: 0
        };

        return extract(spec);
    }
}

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
                color: {
                    field: "name",
                    type: "ordinal",
                    "scale": {
                      "domain": ["w","h","a","o","b"],
                      "range": ["#"+Color.Category10[0].toHexa(),
                                "#"+Color.Category10[1].toHexa(),
                                "#"+Color.Category10[2].toHexa(),
                                "#"+Color.Category10[3].toHexa(),
                                "#"+Color.Category10[4].toHexa()]
                    },
                },
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

    static punchcard(buffers:DerivedBuffer[], values:number[],
        options:{
            width?:number,
            height?:number,
            'z.scale.domain': [number, number]
        } = {'z.scale.domain': [0, 1]}
    ) {
        let n = buffers.length;
        let cols = Math.ceil(Math.sqrt(n));
        let width = options.width || 30;
        let height = options.height || 30;

        let spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
            data: {
                values: buffers.map((buffer, i) => {return {
                    name: buffer.originalDataBuffer.name,
                    value: values[i],
                    row: Math.floor(i / cols),
                    col: i % cols,
                }})
            },
            mark: "circle",
            encoding: {
                "x": {"field": "col", "type": "ordinal"},
                "y": {"field": "row", "type": "ordinal"},
                "size": {
                    "field": "value",
                    "type": "quantitative",
                    scale: {
                        domain: options["z.scale.domain"]
                    }
                },
                color: {
                    "field": "name",
                    "type": "ordinal",
                    scale: {
                        domain: buffers.map(b => b.originalDataBuffer.name),
                        range: buffers.map(b => '#' + (b.color || Color.Blue).toHexa())
                    }
                }
            },
            autosize: "none",
            config: {
                group: {
                    strokeWidth: 0
                },
                axis: {
                    domain: false,
                    ticks: false,
                    labels: false,
                    grid: false,
                    tickExtra: false,
                    gridColor: null
                },
                mark: {
                    opacity: 1
                }
            },
            width: width / 2,
            height: height / 2, // TODO (jaemin): Why divided by 2?
            padding: 0
        };

        return extract(spec);
    }
}

import DerivedBuffer from './derived-buffer';
import Color from './color';
import { ScaleTrait } from './scale';
import extract from './vega-extractor'
import Tile from './tile';

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

    static min(buffers:DerivedBuffer[], values:number[]):Color {
        let best = values[0];
        let bestIndex = 0;

        values.forEach((value, i) => {
          if(value < best) {
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

    static multiplicativeMix(buffers:DerivedBuffer[], values:number[]):Color {
        let ret = new Color(1, 1, 1, 1);

        values.forEach((value, i) => {
            let color = buffers[i].colorScale.map(value);

            ret = new Color(
                ret.r * color.r,
                ret.g * color.g,
                ret.b * color.b,
                ret.a * color.a
            );
        })

        return ret;
    }

    static none(buffers:DerivedBuffer[], values:number[]):Color {
        return Color.None;
    }

    static one(buffer:DerivedBuffer, value:number):Color {
        return buffer.colorScale.map(value);
    }

    static bars(buffers:DerivedBuffer[], values:number[],
        options:{
            width?:number,
            height?:number,
            'y.scale.domain': [number, number],
            'y.scale.type'?: string,
            'y.scale.base'?: number
        } = {'y.scale.domain': [0, 1], 'y.scale.type': 'linear', 'y.scale.base': 10}
    ) {
        let data = buffers.map((buffer, i) => {
            return {name: buffer.originalDataBuffer.name, value: values[i]}}
        );
        let spec = {
            $schema: "https://vega.github.io/schema/vega-lite/v2.0.json",
            data: {
                values: data
            },
            mark: "bar",
            encoding: {
                x: {field: "name", type: "ordinal"},
                color: {
                    field: "name",
                    type: "ordinal",
                    scale: {
                      domain: data.map(d => d.name),
                      range: data.map((d, i) => buffers[i].color!.css())
                      // will use a fully opaque color, since we use the length encoding
                    }
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    scale: {
                        domain: options['y.scale.domain'],
                        type: options['y.scale.type'],
                        base: options['y.scale.base']
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
                    domain: false,
                    grid: false,
                    tickExtra: false,
                    gridColor: null
                }
            },
            width: options.width || 30,
            height: options.height ? options.height : 30,
            padding: 0
        };

        return extract(spec);
    }

    static punchcard(buffers:DerivedBuffer[], values:number[],
        options:{
            width?:number,
            height?:number,
            'z.scale.domain': [number, number],
            'z.scale.type': string
        } = {'z.scale.domain': [0, 1], 'z.scale.type': 'linear'}
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
                        domain: options["z.scale.domain"],
                        type: options["z.scale.type"]
                    }
                },
                color: {
                    "field": "name",
                    "type": "ordinal",
                    scale: {
                        domain: buffers.map(b => b.originalDataBuffer.name),
                        range: buffers.map(b => (b.color || Color.Blue).css())
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
            width: width / 1,
            height: height / 1,
            padding: 0
        };

        return extract(spec);
    }

    static hatch(tile:Tile, buffers:DerivedBuffer[], thickness:number, proportinal:boolean): HTMLCanvasElement{
        let hatchCanvas = <HTMLCanvasElement>document.createElement('canvas');
        hatchCanvas.width  = tile.mask.width;
        hatchCanvas.height = tile.mask.height;

        let ctx = hatchCanvas.getContext("2d")!;

        ctx.drawImage(tile.mask.getCanvas(), 0, 0);
        ctx.globalCompositeOperation="source-atop";
        ctx.fillStyle='white';
        ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        let dataValues2 = [];
        let diag = Math.sqrt(hatchCanvas.width*hatchCanvas.width+hatchCanvas.height*hatchCanvas.height);
        let sum = 0;
        for (let i in tile.dataValues){
            sum+=tile.dataValues[i];
            dataValues2.push({"val":tile.dataValues[i], "index":i});
        }
        dataValues2.sort(function(a, b){return a.val<b.val?1:-1;})

        let acc = 0;
        //buffers.forEach((buffer, i) => {
        for (let j=0; j<dataValues2.length; j++){
            let obj:any = dataValues2[j];
            let buffer = buffers[obj.index];
            ctx.save();
            ctx.translate(hatchCanvas.width/2, hatchCanvas.height/2);
            ctx.rotate(buffer.angle!);
            ctx.strokeStyle = buffer.color!.css();
            if(proportinal){
                ctx.lineWidth=thickness * tile.dataValues.length * tile.dataValues[obj.index] / sum;
            } else{
                ctx.lineWidth=thickness;
            }
            acc += ctx.lineWidth/2;
            let tx = tile.x+hatchCanvas.width/2-diag;

            for (let i:number=acc-diag-(tx%(tile.dataValues.length*thickness)); i<diag; i+=tile.dataValues.length*thickness){
                ctx.beginPath();
                ctx.moveTo(i, -diag);
                ctx.lineTo(i,  diag);
                ctx.stroke();
                //ctx.fillRect(i, 0, 2, hatchCanvas.height);
            }
            acc += ctx.lineWidth/2;
            ctx.restore();
        }

        let pixels = ctx.getImageData(0, 0, hatchCanvas.width, hatchCanvas.height)!;

        return hatchCanvas;
    }
}

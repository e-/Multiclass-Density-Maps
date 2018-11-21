import ClassBuffer from "./class-buffer";
import Color from "./color";
import extract from "./vega-extractor"
import Tile from "./tile";
import * as util from "./util";
import { isUndefined } from "util";

export default class Assembly {
    static max(buffers: ClassBuffer[], values: number[]): Color {
        let best = values[0];
        let bestIndex = 0;

        values.forEach((value, i) => {
            if (value > best) {
                best = value;
                bestIndex = i;
            }
        });

        return buffers[bestIndex].colorScale.map(best);
    }

    static invmin(buffers: ClassBuffer[], values: number[], threshold = 1): Color {
        let best = Infinity;
        let bestIndex = -1;

        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            if (value < threshold) continue;
            if (value < best) {
                best = value;
                bestIndex = i;
            }
        }
        if (bestIndex == -1)
            return buffers[0].colorScale.map(0);
        let buffer = buffers[bestIndex];
        let scaleTrait = buffer.colorScale.interpolator;

        return buffer.colorScale.map(scaleTrait.domain[1] - best);
    }

    static mean(buffers: ClassBuffer[], values: number[]): Color {
        let sum = 0;
        let ret = new Color(0, 0, 0, 0);

        values.forEach((value, i) => {
            if (value != 0) {
                let color = buffers[i].colorScale.map(value);
                ret.r += color.r * value;
                ret.g += color.g * value;
                ret.b += color.b * value;
                ret.a += color.a * value;
                sum += value;
            }
        });

        if (sum > 0) {
            ret.rdissolve(1 / sum);
        }
        //if (! ret.isValid())console.log("Invalid color "+ret);

        return ret;
    }

    static add(buffers: ClassBuffer[], values: number[]): Color {
        let ret = new Color(0, 0, 0, 1);

        values.forEach((value, i) => {
            ret.radd(buffers[i].colorScale.map(value));
        });

        //ret = ret.clamp();
        return ret;
    }

    static multiply(buffers: ClassBuffer[], values: number[]): Color {
        let ret = new Color(1, 1, 1, 1);

        values.forEach((value, i) => {
            let color = buffers[i].colorScale.map(value);

            ret.r *= color.r;
            ret.g *= color.g;
            ret.b *= color.b;
            ret.a *= color.a;
        });

        return ret;
    }

    static none(): Color {
        return Color.None;
    }

    static one(buffer: ClassBuffer, value: number): Color {
        return buffer.colorScale.map(value);
    }

    static bars(buffers: ClassBuffer[], values: number[],
        options: {
            width?: number,
            height?: number,
            "y.scale.domain": [number, number],
            "y.scale.type"?: string,
            "y.scale.base"?: number,
            "y.scale.exponent"?: number
        } = { "y.scale.domain": [0, 1], "y.scale.type": "linear", "y.scale.base": 10 }
    ) {
        let data = buffers.map((buffer, i) => {
            return { name: buffer.dataBuffer.name, value: values[i] }
        }
        );
        let spec = {
            $schema: "https://vega.github.io/schema/vega-lite/v2.0.json",
            data: {
                values: data
            },
            mark: "bar",
            encoding: {
                x: {
                    field: "name",
                    type: "ordinal",
                    legend: false,
                    axis: false
                },
                color: {
                    field: "name",
                    type: "ordinal",
                    scale: {
                        domain: data.map(d => d.name),
                        range: data.map((d, i) => buffers[i].color1!.css())
                        // will use a fully opaque color, since we use the length encoding
                    },
                    legend: false
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    scale: {
                        domain: options["y.scale.domain"],
                        type: options["y.scale.type"],
                        base: options["y.scale.type"] === "log" ? options["y.scale.base"] : undefined,
                        exponent: options["y.scale.type"] === "pow" ? options["y.scale.exponent"] : undefined
                    },
                    lgend: false,
                    axis: false
                }
            },
            config: {
                group: {
                    strokeWidth: 0
                }
            },
            width: options.width || 30,
            height: options.height || 30,
            padding: 0
        };

        return extract(spec);
    }

    static punchcard(buffers: ClassBuffer[], names: string[], values: number[],
        options: {
            width?: number,
            height?: number,
            "z.scale.domain"?: [number, number],
            "z.scale.type"?: string,
            "z.scale.base"?: number,
            cols?: number,
            factor?: number
        } = { "z.scale.domain": [0, 1], "z.scale.type": "linear", "z.scale.base": 10, factor: 8 }
    ) {
        let n = buffers.length;
        let cols = options.cols || Math.ceil(Math.sqrt(n));
        let width = options.width || 30;
        let height = options.height || 30;

        let colors = buffers.map(b => (b.color1 || Color.Blue).css());

        let factor = options.factor || 8;
        // TODO: I am really not sure why this magic number is required to
        // determine the size of full circles. It seems that this number changes
        // depending on the size of a tile and the number of circles in a tile.

        let data = buffers.map((buffer, i) => {
            return {
                name: names[i],
                value: values[i],
                row: Math.floor(i / cols),
                col: i % cols,
            }
        });

        // (1, 1, 16)
        // (2, 4, 8)
        // (3, 9, 4)
        // (4, 16, 2)
        // n = 4;
        // cols = 2;

        // names = util.arange(n).map(d => d.toString());
        // colors = new Array(n).fill(Color.Blue.css());
        // data = util.arange(n).map(i => {
        //     return {
        //         name: i.toString(),
        //         value: options["z.scale.domain"][1],
        //         row: Math.floor(i / cols),
        //         col: i % cols
        //     }
        // });

        let rows = Math.ceil(n / cols);
        let spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
            data: {
                values: data
            },
            mark: "circle",
            encoding: {
                x: {
                    field: "col",
                    type: "ordinal",
                    axis: false,
                    legend: false,
                    scale: {
                        type: "point",
                        domain: util.arange(cols),
                        padding: 0.5
                    }
                },
                y: {
                    field: "row",
                    type: "ordinal",
                    axis: false,
                    legend: false,
                    scale: {
                        type: "point",
                        domain: util.arange(rows),
                        padding: 0.5
                    }
                },
                size: {
                    field: "value",
                    type: "quantitative",
                    scale: {
                        domain: options["z.scale.domain"],
                        type: options["z.scale.type"],
                        range: [0, Math.min(width, height) * factor]
                    },
                    legend: false
                },
                color: {
                    field: "name",
                    type: "ordinal",
                    scale: {
                        domain: names,
                        range: colors
                    },
                    legend: false
                }
            },
            autosize: "none",
            config: {
                mark: {
                    opacity: 1
                },
                group: {
                    strokeWidth: 0,
                    stroke: "transparent"
                },
            },
            width: width,
            height: height,
            padding: 0
        };

        return extract(spec);
    }

    static hatch(tile: Tile, buffers: ClassBuffer[], dataValues: number[],
        options: {
            thickness: number,
            sort: boolean,
            widthprop?: 'percent' | number,
            colprop: boolean
        }): HTMLCanvasElement {

        let hatchCanvas = <HTMLCanvasElement>document.createElement("canvas");
        hatchCanvas.width = tile.mask.width;
        hatchCanvas.height = tile.mask.height;

        let ctx = hatchCanvas.getContext("2d")!;


        ctx.drawImage(tile.mask.getCanvas(), 0, 0);
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        let sorted: { index: number, value: number }[] = [];
        let diag = Math.sqrt(hatchCanvas.width * hatchCanvas.width + hatchCanvas.height * hatchCanvas.height);
        let sum = 0;
        dataValues.forEach((value, i) => {
            sum += value;
            sorted.push({
                index: i,
                value: value
            });
        })

        let acc = 0;

        if (options.sort)
            sorted = sorted.sort(function (a, b) { return b.value - a.value });

        sorted.forEach(d => {
            let dataValue = d.value;
            let i = d.index;

            let buffer = buffers[i];
            ctx.save();
            ctx.translate(hatchCanvas.width / 2, hatchCanvas.height / 2);
            ctx.rotate(buffer.angle!);
            ctx.strokeStyle = buffer.colorScale.map(dataValue).css();

            if (options.colprop)
                ctx.strokeStyle = buffer.colorScale.map(dataValue).css();
            else
                ctx.strokeStyle = buffer.color1!.css();

            if (isUndefined(options.widthprop))
                ctx.lineWidth = options.thickness;
            else if (options.widthprop === "percent")
                ctx.lineWidth = options.thickness * tile.dataValues.length * dataValue / sum;
            else
                ctx.lineWidth = options.thickness * tile.dataValues.length * dataValue / <number>options.widthprop;

            acc += ctx.lineWidth / 2;
            let tx = tile.x + hatchCanvas.width / 2 - diag;

            for (let i: number = acc - diag - (tx % (tile.dataValues.length * options.thickness));
                i < diag;
                i += tile.dataValues.length * options.thickness) {
                ctx.beginPath();
                ctx.moveTo(i, -diag);
                ctx.lineTo(i, diag);
                ctx.stroke();
                //ctx.fillRect(i, 0, 2, hatchCanvas.height);
            }
            acc += ctx.lineWidth / 2;
            ctx.restore();
        });

        return hatchCanvas;
    }
}

import * as d3 from 'd3';
import DerivedBuffer from './derived-buffer';
import * as Parser from './parser';
import Color from './color';
import Interpreter from './interp';
import * as Scale from './scale';
import Composer from './composer';
import vegaEmbed from 'vega-embed';

function translate(x:number, y:number) {
    return `translate(${x},${y})`;
}

let counter = 0;
// see degree at http://angrytools.com/gradient/
function linearGradient(defs:any, interpolator:Scale.ScaleTrait,
    db:DerivedBuffer, degree:number = 0):string {

    let x1 = 0.5 - Math.cos(degree) / 2;
    let x2 = 0.5 + Math.cos(degree) / 2;
    let y1 = 0.5 + Math.sin(degree) / 2;
    let y2 = 0.5 - Math.sin(degree) / 2;

    let id = `gradient_${counter++}`;

    let lg = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', y1)
        .attr('y2', y2)

    lg.append('stop')
        .attr('offset', 0)
        .style('stop-color', db.colorScale.map(interpolator.domain[0]).css());

    lg.append('stop')
        .attr('offset', 1)
        .style('stop-color', db.colorScale.map(interpolator.domain[1]).css());

    return id;
}

function equiDepthColorMap(defs:any, interpolator:Scale.ScaleTrait, db:DerivedBuffer):string {
    let id = `gradient_${counter++}`;
    let scale = interpolator as Scale.EquiDepthScale;

    let lg = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', 0)
        .attr('x2', 1)
        .attr('y1', 0)
        .attr('y2', 0)

    let n = scale.level;
    scale.getBounds();

    // bounds do not include the last value
    scale.bounds.concat([scale.bounds[n - 2] + 1]).forEach((value, i) => {
        let color = db.colorScale.map(value - 1);
        if(isNaN(color.r)) color = Color.Transparent;

        lg.append('stop')
            .attr('offset', i / n)
            .style('stop-color', color.css());

        lg.append('stop')
            .attr('offset', (i + 1) / n)
            .style('stop-color', color.css());
    });

    return id;
}

function horizontalColormaps(id:string, interp:Interpreter) {
    let derivedBuffers:DerivedBuffer[] = interp.derivedBuffers;
    let spec = interp.legend as Parser.LegendSpec;

    let svg = d3.select('#' + id)
        .style('font-family', spec.fontFamily)
        .style('font-size', spec.fontSize)

    let defs = svg.append('defs');
    let g = svg.append('g').attr('transform', translate(0, 0));


    let rowHeight = spec.rowHeight;
    let gutter = spec.gutter;
    let labelWidth = spec.labelWidth;
    let colorMapWidth = spec.colorMapWidth;

    svg
        .attr('width', labelWidth + colorMapWidth + gutter)
        .attr('height', (rowHeight + gutter) * derivedBuffers.length + rowHeight)

    let update = g.selectAll('g')
        .data(derivedBuffers)


    let enter = update.enter()
        .append('g')
        .attr('transform', (d, i) => translate(0, (rowHeight + gutter) * i))

    let labels = interp.labels == undefined ? interp.bufferNames : interp.labels;
    enter.append('text')
        .text((d, i) => labels[i])
        .attr('transform', translate(labelWidth, 0))
        .attr('dy', '1em')
        .attr('text-anchor', 'end')


    let gradientFunc:(defs:any, interpolator:Scale.ScaleTrait, db:DerivedBuffer) => string;

    // domain numbers will be shown
    let tickValues:number[] = [];

    // markers (vertical bars) will be shown
    let markerValues:number[] = [];

    let colormapScale = (v:number, i:number) => interp.scale.map(v) * colorMapWidth;

    // scales that show continuous color maps
    if(!interp.rescale || ["linear", "pow", "sqrt", "cbrt", "log"].indexOf(interp.rescale!.type) >= 0)
    {
        gradientFunc = linearGradient;
        let n = spec.markers;

        tickValues = [derivedBuffers[0].colorScale.interpolator.domain[0],
                    derivedBuffers[0].colorScale.interpolator.domain[1]];

        markerValues = d3.range(n).map(i => tickValues[0] + (tickValues[1] - tickValues[0]) * (i + 1) / (n + 1));
    }
    else if(interp.rescale!.type === "equidepth") { // discrete such as equidepth
        gradientFunc = equiDepthColorMap;

        tickValues = [derivedBuffers[0].colorScale.interpolator.domain[0]]
            .concat((interp.scale as Scale.EquiDepthScale).bounds);

        colormapScale = (v, i) => colorMapWidth / (tickValues.length - 1) * i;
        markerValues = [];
    }

    let ids = derivedBuffers.map(db => {
        return gradientFunc(defs, interp.scale, db);
    })

    // domain value to width

    enter
        .append('rect')
        .attr('height', rowHeight)
        .attr('width', colorMapWidth)
        .attr('transform', translate(labelWidth + gutter, 0))
        .attr('stroke', '#ddd')
        .style('fill', (d, i) => `url(#${ids[i]})`)

    let tickG = g
        .append('g')
        .attr('class', 'ticks')
        .attr('transform', translate(labelWidth + gutter, (rowHeight + gutter) * derivedBuffers.length))

    let ticks = tickG
        .selectAll('text.tick')
        .data(tickValues)

    let step = 1;
    if(spec.numTicks) {
        step = Math.floor(tickValues.length / spec.numTicks!);
    }

    ticks.enter()
        .append('text')
        .attr('class', 'tick')
        .attr('text-anchor', (d, i) => {
            if(i === 0) return 'start';
            else if(i === tickValues.length - 1) return 'end';
            return 'middle';
        })
        .attr('transform', (d, i) => translate(colormapScale(d, i), 0))
        .style('display', (d, i) => {
            if(i % step === 0) return 'inline';
            return 'none';
        })
        .style('font-size', spec.tickFontSize)
        .attr('dy', '.5em')
        .text(d => d3.format(spec.format)(d))

    enter
        .selectAll('line')
        .data(markerValues)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', rowHeight)
        .style('stroke', '#ddd')
        .style('stroke-width', 1)
        .style('shape-rendering', 'crispEdges')
        .attr('transform', (d, i) => translate(labelWidth + gutter + colormapScale(d, i), 0))
}

function multiplicativeCircles(id:string, interp:Interpreter) {
    let derivedBuffers:DerivedBuffer[] = interp.derivedBuffers;
    let spec = interp.legend as Parser.LegendSpec;

    let size = spec.size;
    let svg = d3.select('#' + id)
        .style('font-family', spec.fontFamily)
        .style('font-size', spec.fontSize)
        .attr('width', size)
        .attr('height', size)

    let defs = svg.append('defs');
    let g = svg.append('g').attr('transform', translate(0, 0));

    let center = size / 2;
    let r = size / 6;
    let theta = Math.PI * 2 / derivedBuffers.length;
    let ids = derivedBuffers.map((d, i) => {
        return linearGradient(defs, interp.scale, d, -theta * i - Math.PI / 2);
    })

    g.selectAll('circle')
        .data(derivedBuffers)
        .enter()
        .append('circle')
        .attr('r', r)
        .attr('fill', d => d.color!.css())
        .attr('cx', (d, i) => center + r * Math.sin(theta * i) / 2)
        .attr('cy', (d, i) => center - r * Math.cos(theta * i) / 2)
        .style('fill', (d, i) => `url(#${ids[i]})`)
        .style('mix-blend-mode', 'multiply');

    g.selectAll('text')
        .data(derivedBuffers)
        .enter()
        .append('text')
        .text(d => d.originalDataBuffer.name)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.5em')
        .attr('transform', (d, i) => translate(
            center + r * Math.sin(theta * i) * 2,
            center - r * Math.cos(theta * i) * 2
        ));


        // .attr('cx', (d, i) => )
        // .attr('cy', (d, i) => )
        // .style('opacity', 0.9)
        // .style('mix-blend-mode', 'multiply');

}

function bars(id:string, interp:Interpreter) {
    let derivedBuffers:DerivedBuffer[] = interp.derivedBuffers;
    let n = derivedBuffers.length;
    let spec = interp.legend as Parser.LegendSpec;

    let svg = d3.select('#' + id)
        .style('font-family', spec.fontFamily)
        .style('font-size', spec.fontSize)

    let sum = new Array(n).fill(0);

    for(let tile of interp.tiles) {
        tile.dataValues.forEach((value, i) => {
            sum[i] += value;
        })
    }

    let mean = sum.map(s => s / n);

    let data = derivedBuffers.map((buffer, i) => {
        return {category: buffer.originalDataBuffer.name, value: mean[i]}}
    );

    let barSpec:any = {
        $schema: "https://vega.github.io/schema/vega-lite/v2.0.json",
        data: {
            values: data
        },
        mark: "bar",
        encoding: {
            x: {
                field: "category",
                type: "ordinal",
                // legend: false,
                // axis: {
                //     title: null
                // }
            },
            color: {
                field: "category",
                type: "ordinal",
                scale: {
                  domain: data.map(d => d.category),
                  range: data.map((d, i) => derivedBuffers[i].color!.css())
                },
                // legend: false
            },
            y: {
                field: "value",
                type: "quantitative",
                scale: {
                    type: "linear"
                },
                // legend: false,
                // axis: false
            }
        },
        config: {
            group: {
                strokeWidth: 0
            }
        },
        width: spec.width,
        height: spec.height
    };

    let wrapper = document.createElement('div') as HTMLElement;
    return vegaEmbed(wrapper as HTMLBaseElement, barSpec, {
        actions: false,
        renderer: 'svg'
    }).then(() => {
        let result = wrapper!.getElementsByTagName('svg')[0];
        let svgNode = <SVGSVGElement>svg.node();

        svgNode.innerHTML = result.innerHTML;
        let rect = svgNode.getBoundingClientRect();
        svg.attr("width", <any>result.getAttribute("width"))
            .attr("height", <any>result.getAttribute("height"));
    });
}

function punchcard(id:string, interp:Interpreter) {
    let derivedBuffers:DerivedBuffer[] = interp.derivedBuffers;
    let n = derivedBuffers.length;
    let spec = interp.legend as Parser.LegendSpec;

    let svg = d3.select('#' + id)
        .style('font-family', spec.fontFamily)
        .style('font-size', spec.fontSize)

    let sum = new Array(n).fill(0);

    for(let tile of interp.tiles) {
        tile.dataValues.forEach((value, i) => {
            sum[i] += value;
        })
    }

    let mean = sum.map(s => s / n);

    let cols = Math.ceil(Math.sqrt(n));

    let data = derivedBuffers.map((buffer, i) => {return {
        category: buffer.originalDataBuffer.name,
        value: mean[i],
        row: Math.floor(i / cols),
        col: i % cols,
    }});

    let barSpec:any = {
        $schema: "https://vega.github.io/schema/vega-lite/v2.0.json",
        data: {
            values: data
        },
        layer: [
            {
                mark: "circle",
                encoding: {
                    size: {
                        field: "value",
                        type: "quantitative",
                        scale: {
                            type: "linear"
                        },
                        // legend: false
                    },
                    color: {
                        field: "category",
                        type: "ordinal",
                        scale: {
                            domain: derivedBuffers.map(b => b.originalDataBuffer.name),
                            range: derivedBuffers.map(b => (b.color || Color.Blue).css())
                        },
                        // legend: false
                    }
                }
            },
            {
                mark: {
                    type: "text",
                    baseline: "middle"
                },
                encoding: {
                    text: {field: "category"}
                }
            }
        ],
        encoding: {
            x: {field: "col", type: "ordinal", axis: false, legend:false},
            y: {field: "row", type: "ordinal", axis: false, legend:false},
        },
        config: {
            group: {
                strokeWidth: 0
            },
            mark: {
                opacity: 1
            }
        },
        width: spec.width,
        height: spec.height,
        padding: 0
    };

    let wrapper = document.createElement('div') as HTMLElement;
    return vegaEmbed(wrapper as HTMLBaseElement, barSpec, {
        actions: false,
        renderer: 'svg'
    }).then(() => {
        let result = wrapper!.getElementsByTagName('svg')[0];
        let svgNode = <SVGSVGElement>svg.node();

        svgNode.innerHTML = result.innerHTML;
        let rect = svgNode.getBoundingClientRect();
        svg.attr("width", <any>result.getAttribute("width"))
            .attr("height", <any>result.getAttribute("height"));
    });
}

export default function LegendBuilder(id:string, interp:Interpreter) {
    if(interp.legend === false) return;

    if(interp.composer === Composer.multiplicativeMix) {
        multiplicativeCircles(id, interp);
    }
    else if(interp.compose.mix === "glyph") {
        if(interp.compose.glyphSpec!.template === "bars") {
            bars(id, interp);
        }
        else if(interp.compose.glyphSpec!.template === "punchcard") {
            punchcard(id, interp);
        }
    }
    else {
        horizontalColormaps(id, interp);
    }
}

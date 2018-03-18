import * as d3 from 'd3';
import DerivedBuffer from './derived-buffer';
import * as Parser from './parser';
import Color from './color';
import Interpreter from './interp';
import * as Scale from './scale';

function translate(x:number, y:number) {
    return `translate(${x},${y})`;
}

let counter = 0;
function linearGradient(defs:any, interpolator:Scale.ScaleTrait, db:DerivedBuffer):string {
    let id = `gradient_${counter++}`;

    let lg = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', 0)
        .attr('x2', 1)
        .attr('y1', 0)
        .attr('y2', 0)

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

    // bounds do not include the last value
    scale.bounds.concat([scale.bounds[n - 2] + 1]).forEach((value, i) => {
        lg.append('stop')
            .attr('offset', i / n)
            .style('stop-color', db.colorScale.map(value - 1).css());

        lg.append('stop')
            .attr('offset', (i + 1) / n)
            .style('stop-color', db.colorScale.map(value - 1).css());
    });

    return id;
}

export default function LegendBuilder(id:string, interp:Interpreter) {
    let derivedBuffers:DerivedBuffer[] = interp.derivedBuffers;

    if(interp.legend === false) return;
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

    ticks.enter()
        .append('text')
        .attr('class', 'tick')
        .attr('text-anchor', (d, i) => {
            if(i === 0) return 'start';
            else if(i === tickValues.length - 1) return 'end';
            return 'middle';
        })
        .attr('transform', (d, i) => translate(colormapScale(d, i), 0))
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

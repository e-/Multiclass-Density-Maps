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
    let range = scale.range;
    let min = range[0];
    let w = (range[1] - range[0]) / n;

    d3.range(n).forEach(i => {
        let value:number;
        if(i === n - 1) value = scale.bounds[n - 2];
        else value = scale.bounds[i] - 1;

        lg.append('stop')
            .attr('offset', i / n)
            .style('stop-color', db.colorScale.map(value).css());

        lg.append('stop')
            .attr('offset', (i + 1) / n)
            .style('stop-color', db.colorScale.map(value).css());
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

    // scales that show continuous color maps
    if(!interp.rescale || ["linear", "pow", "sqrt", "cbrt", "log"].indexOf(interp.rescale!.type) >= 0)
    {
        gradientFunc = linearGradient;
    }
    else if(interp.rescale!.type === "equidepth") { // discrete such as equidepth
        gradientFunc = equiDepthColorMap;
    }

    let ids = derivedBuffers.map(db => {
        return gradientFunc(defs, interp.scale, db);
    })

    enter
        .append('rect')
        .attr('height', rowHeight)
        .attr('width', colorMapWidth)
        .attr('transform', translate(labelWidth + gutter, 0))
        .attr('stroke', '#ddd')
        .style('fill', (d, i) => `url(#${ids[i]})`)

    let tickDomain = [derivedBuffers[0].colorScale.interpolator.domain[0],
                    derivedBuffers[0].colorScale.interpolator.domain[1]];

    let tickG = g
        .append('g')
        .attr('class', 'ticks')
        .attr('transform', translate(labelWidth + gutter, (rowHeight + gutter) * derivedBuffers.length))

    let ticks = tickG
        .selectAll('text.tick')
        .data(tickDomain)

    // scale
    //     .domain(derivedBuffers[0].colorScale.interpolator.domain)
    //     .range([0, colorMapWidth]);

    // ticks.enter()
    //     .append('text')
    //     .attr('class', 'tick')
    //     .attr('text-anchor', (d, i) => ['start', 'end'][i])
    //     .attr('transform', (d, i) => translate(scale(d), 0))
    //     .attr('dy', '.5em')
    //     .text(d => d3.format(spec.format)(d))


    // let n = 8;
    // let tickData = d3.range(n).map(i => tickDomain[0] + (tickDomain[1] - tickDomain[0]) * (i + 1) / n);

    // enter
    //     .selectAll('line')
    //     .data(tickData)
    //     .enter()
    //     .append('line')
    //     .attr('x1', 0)
    //     .attr('x2', 0)
    //     .attr('y1', 0)
    //     .attr('y2', rowHeight)
    //     .style('stroke', '#ddd')
    //     .style('stroke-width', 1)
    //     .style('shape-rendering', 'crispEdges')
    //     .attr('transform', (d, i) => translate(labelWidth + gutter + scale(d), 0))

}

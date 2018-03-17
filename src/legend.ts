import * as d3 from 'd3';
import DerivedBuffer from './derived-buffer';
import * as Parser from './parser';
import Color from './color';
import Interpreter from './interp';

function translate(x:number, y:number) {
    return `translate(${x},${y})`;
}

let counter = 0;
function linearGradient(defs:any, color1:Color, color2:Color):string {
    let id = `gradient_${counter++}`;

    let lg = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', 0)
        .attr('x2', 1)
        .attr('y1', 0)
        .attr('y2', 0)

    lg.append('stop')
        .attr('offset', 0)
        .style('stop-color', color1.css());

    lg.append('stop')
        .attr('offset', 1)
        .style('stop-color', color2.css());

    return id;
}

export default function LegendBuilder(id:string, interp:Interpreter) {
    let derivedBuffers:DerivedBuffer[] = interp.derivedBuffers;

    let svg = d3.select('#' + id)
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')

    let defs = svg.append('defs');
    let g = svg.append('g').attr('transform', translate(0, 0));

    let rowHeight = 15;
    let gutter = 5;
    let labelWidth = 40;
    let colorMapWidth = 120;

    svg
        .attr('width', labelWidth + colorMapWidth + gutter)
        .attr('height', (rowHeight + gutter) * derivedBuffers.length + rowHeight)

    let update = g.selectAll('g')
        .data(derivedBuffers)


    let enter = update.enter()
        .append('g')
        .attr('transform', (d, i) => translate(0, (rowHeight + gutter) * i))

    var labels = interp.labels==undefined ? interp.bufferNames : interp.labels;
    enter.append('text')
        .text((d, i) => labels[i])
        .attr('transform', translate(labelWidth, 0))
        .attr('dy', '1em')
        .attr('text-anchor', 'end')


    let ids = derivedBuffers.map(db => {
        return linearGradient(defs, db.colorScale.colorRange[0], db.colorScale.colorRange[1]);
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

    let scale:any;

    switch(interp.rescale) {
        case('log'): scale = d3.scaleLog().base(Math.E); break;
        case('pow'): scale = d3.scalePow().exponent(Math.E); break;
        case('sqrt'): scale = d3.scaleSqrt(); break;
        case('cbrt'): scale = d3.scalePow().exponent(1/3); break;
        case('equidepth'): scale = d3.scaleLog().base(Math.E); break;
        default: scale = d3.scaleLinear();
    }
    scale
        .domain(derivedBuffers[0].colorScale.interpolator.domain)
        .range([0, colorMapWidth]);

    ticks.enter()
        .append('text')
        .attr('class', 'tick')
        .attr('text-anchor', (d, i) => ['start', 'end'][i])
        .attr('transform', (d, i) => translate(scale(d), 0))
        .attr('dy', '.5em')
        .text(d => d3.format(',.1f')(d))


    let n = 8;
    let tickData = d3.range(n).map(i => tickDomain[0] + (tickDomain[1] - tickDomain[0]) * (i + 1) / n);

    enter
        .selectAll('line')
        .data(tickData)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', rowHeight)
        .style('stroke', '#ddd')
        .style('stroke-width', 1)
        .style('shape-rendering', 'crispEdges')
        .attr('transform', (d, i) => translate(labelWidth + gutter + scale(d), 0))

}

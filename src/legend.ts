import * as d3 from 'd3';
import DerivedBuffer from './derived-buffer';
import * as Parser from './parser';
import Color from './color';

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
        .style('stop-color', '#' + color1.hex());

    lg.append('stop')
        .attr('offset', 1)
        .style('stop-color', '#' + color2.hex());

    return id;
}

export default function LegendBuilder(id:string, config:Parser.Configuration, derivedBuffers:DerivedBuffer[]) {
    let svg = d3.select('#' + id)
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')

    let defs = svg.append('defs');
    let g = svg.append('g').attr('transform', translate(10, 20));

    let rowHeight = 15;
    let gutter = 5;
    let labelWidth = 40;
    let colorMapWidth = 120;

    let update = g.selectAll('g')
        .data(derivedBuffers)


    let enter = update.enter()
        .append('g')
        .attr('transform', (d, i) => translate(0, (rowHeight + gutter) * i))

    enter.append('text')
        .text((d, i) => config.data!.dataSpec!.buffers![i].value)
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

    let tickData = [derivedBuffers[0].colorScale.interpolator.range[0], derivedBuffers[0].colorScale.interpolator.range[1]];

    let tickG = g.select('g.ticks')
        .datum(tickData)
        .enter()
        .append('g')
        .attr('class', 'ticks')
        .attr('transform', translate(labelWidth + gutter, (rowHeight + gutter) * derivedBuffers.length))

    let ticks = tickG
        .selectAll('text.tick')
        .data(tickData)

    ticks.enter()
        .append('text')
        .attr('class', 'tick')
        .attr('text-anchor', (d, i) => ['start', 'end'][i])
        .text(d => d)
}

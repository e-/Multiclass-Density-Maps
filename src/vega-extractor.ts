import vegaEmbed from 'vega-embed';

export default function extract(spec:any, options: {clip?: [number, number, number, number]} = {}) {
    let wrapper = document.createElement('div') as HTMLElement;

    return vegaEmbed(wrapper as HTMLBaseElement, spec, {
        actions: false
    }).then(() => {
        let canvas = wrapper!.getElementsByTagName('canvas')[0];
        let ctx:any = canvas.getContext('2d');

        return ctx.getImageData.apply(ctx, options.clip || [0, 0, canvas.width, canvas.height]) as ImageData;
    });
}

# Multiclass Density Maps

![teaser](https://raw.githubusercontent.com/e-/Multiclass-Density-Maps/master/teaser.png)

## What is This?

Density maps (also known as density plots, binned scatterplots, and heatmaps) are our best friend to scale scatterplots. However, it is nontrivial to visualize multiclass data on density maps. Actually, various designs have been used (see the picture above). In this work, we unified those various designs into a single model, *the Class Buffer Model*.

## Interactive Demos

- [A gallery of examples](https://jaeminjo.github.io/Multiclass-Density-Maps/) (this repo)
- [An online editor](https://jaeminjo.github.io/Multiclass-Density-Map-Editor/) ([repo](https://github.com/e-/Multiclass-Density-Map-Editor))

## Reference

J. Jo, F. Vernier, P. Dragicevic and J. Fekete, "A Declarative Rendering Model for Multiclass Density Maps," in IEEE Transactions on Visualization and Computer Graphics. doi: 10.1109/TVCG.2018.2865141 [pdf (hal)](https://hal.inria.fr/hal-01848427/file/Multiclass_Density_Maps.pdf)

## Integration with Your Code

Install via npm:

```bash
npm install multiclass-density-maps --save
```

and import it in your code:

```ts
import * as MDM from 'multiclass-density-maps';
```

Parse and render a specification:

```ts
let spec = // enter your JSON speficiation here.

let config = new MDM.Config(spec); // parse the specification

config.load().then(() => { // load the data
    let interp = new MDM.Interpreter(config); // create an interpreter

    interp.interpret(); // interpret the specification

    interp.render(document.getElementsByTagName('div')[0]); // render it to a div element.
})
```


## Development

Install NodeJS and NPM from https://nodejs.org/en/download/

Clone the repo:

```bash
git clone https://github.com/e-/Multiclass-Density-Maps.git
cd Multiclass-Density-Maps
```

Install the dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm start
```

Open the address that the server gives and navigate to `index.html`.

## FAQ

1) Problems when installing `topojson`: Try `npm install topojson --no-bin-links`.

2) How can I use my own data?: Here are some examples using different data sources: [https://github.com/e-/Multiclass-Density-Maps/tree/master/data](https://github.com/e-/Multiclass-Density-Maps/tree/master/data)

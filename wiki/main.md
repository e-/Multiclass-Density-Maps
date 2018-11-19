# Specifying a Multiclass Density Map

## Version

In our paper, we provided some shortened examples of MDM specifications.
Those specifications will work, but we made an improved grammar for specifications with better readability.
We will use the new one for the explanation but also provide some details on the old one.

## Specification Example
Here is a huge example of an MDM specification:

```json
{
    "data": { 
        "url": "census.snappy_data.json"
    },
    "style": {
        "classes": [
            {
                "name": "w",
                "alias": "White",
                "color0": "White",
                "color1": "Blue"
            },
            {
                "name": "h",
                "alias": "Hispanic",
                "color0": "White",
                "color1": "Orange"
            },
            {
                "name": "a",
                "alias": "Asian",
                "color0": "White",
                "color1": "Red"
            },
            {
                "name": "b",
                "alias": "Black",
                "color0": "White",
                "color1": "Green"
            },
            {
                "name": "o",
                "alias": "Other",
                "color0": "White",
                "color1": "Brown"
            },
        ],
        "scale": {
            "type": "log"
        }
    },
    "assembly": {
        "mix": "mean",
    }
}
```

### Type `Specification`

| Property | Type | Description |
| - | - | -
| data | [`DataSpec`](#type-dataspec) | Specify the location of a schema file and data buffers |
| style | [`StyleSpec`](#type-stylespec) | (Optional) Specify the visual properties for data buffers |
| rebin | [`RebinSpec`](#type-rebinspec) | (Optional) Specify how the visualization space is tiled and the prebinned pixels one the same tile are aggregated |
| assembly | [`AssemblySpec`](#type-assemblyspec) | Specify the assembly function used for encoding multiclass data |

### Type `DataSpec`

A `DataSpec` specifies the location of data buffers that are generated in the binning stage (the first stage in our model, see <https://github.com/e-/Multiclass-Density-Maps/tree/master/data> for how to use our scripts to convert your data to data buffers).
After running the scripts, a dataset with `N` classes is converted to `N + 1` files which are one schema file (e.g., `census.snappy_data.json` in the above example) and `N` data buffers, one for each class.

These files must be located in the same directory, and the schema file must be referenced by its name (e.g., `census.snappy_data.json`) not by the full path to it (e.g., `/my/data/census.snappy_data.json`). The prefix of the path will later be provided when you load the schema file (e.g., `spec.load('/my/data').then(...)`).

| Property | Type | Description |
| - | - | - |
| url | string | The name of a schema file (not the full path to it!) |

### Type `StyleSpec`

| Property | Type | Description |
| - | - | -
| classes | [`ClassSpec[]`](#type-classspec) | (Optional) Specify the order, display names, colors for data buffers |
| scale | [`ScaleSpec`](#type-scalespec) | (Optional) Specify a scale for convert aggregated counts to [0, 1]  |

The `classes` property is an array of `N` `ClassSpec`s where `N` is the number of classes in the dataset. The array order is important because it determines the order of class buffers, which affects their order in a legend and default color assignment.

The `scale` property determines a scale that is used to map counts to a visual variable. Usually, the visual variable is intensity (e.g., 0 is mapped to white and `max_count` is mapped to a fully opaque class-specific color), but it can be length or size if glyphs are used.

#### Type `ClassSpec`

A `ClassSpec` represents properties that are added to a data buffer to make it a class buffer. 

| Property | Type | Description |
| - | - | - |
| name | string | The class name in the schema file. By default, this is displayed in the legend  |
| alias | string | (Optional) The alternative name to be displayed in the legend for a specific class (default: `name`)|
| color0 | [Color](#type-color) | (Optional) A class-specific color to which 0 is mapped (default: white, `rgba(255, 255, 255, 1)`) |
| color1 | [Color](#type-color) | (Optional) A class-specific color to which `max_count` is mapped (default: one of [d3's 10 categorical colors](http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d)) |


#### Type `ScaleSpec`

| Property | Type | Description |
| - | - | - |
| type | string | The type of a scale. It must be one of `linear`, `log`, `sqrt` (square root), `cbrt` (cubic root), and `equidepth`. (default: `linear`) |
| levels | number | The number of different bands for an `equidepth` scale (default: `4`)|

An `equidepth` scale sorts and discretizes data values to `levels` bins with each bin having the same number of data values. Data values in the same bin are encoded with the same color.

#### Type `Color`

A color is a string code such as `rgb(50, 30, 20)`, `rgba(50, 30, 20, 0.5)`, `#ffffff`, or `blue`. We support human-readable color names for [d3's 10 categorical colors](http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d), such as blue, orange, green, red, purple, brown, pink, gray, yellow, and skyblue.

### Type `RebinSepc`

| Property | Type | Description |
| -| - | - |
| type | string | The type of a scale. It must be one of `linear`, `log`, `sqrt` (square root), `cbrt` (cubic root), and `equidepth`. (default: `linear`) |
| aggregation | number | The number of different bands for an `equidepth` scale (default: `4`)|
| width | number | The number of different bands for an `equidepth` scale (default: `4`)|
| height | number | The number of different bands for an `equidepth` scale (default: `4`)|
| size | number | The number of different bands for an `equidepth` scale (default: `4`)|
| feature | number | The number of different bands for an `equidepth` scale (default: `4`)|
| topojson | number | The number of different bands for an `equidepth` scale (default: `4`)|
| points | number | The number of different bands for an `equidepth` scale (default: `4`)|

### Type `AssemblySpec`

| Property | Type | Description |
| - | - | - |
| mix | string |  |
| mixing | string |  |
| shape | string |  |
| size | string |  |
| interval | string |  |
| threshold | string |  |
| sort | string |  |
| colprop | string |  |
| widthprop | string |  |
| order | string |  |
| glyphSpec | string |  |

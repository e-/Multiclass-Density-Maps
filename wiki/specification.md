# Specifying a Multiclass Density Map

## Version

In our paper, we provided some shortened examples of MDM specifications.
Those specifications will work, but we made an improved grammar for specifications with better readability.
We will use the new one in this wiki, but our interpreter is compatible with the old one.

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

These files must be located in the same directory, and the schema file must be referenced by its name (e.g., `census.snappy_data.json`) not by the full path to it (e.g., `/my/data/census.snappy_data.json`). The prefix of the path must be provided later when you load the schema file (e.g., `spec.load('/my/data').then(...)`).

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
| type | string | The type of a scale. One of `linear`, `log`, `sqrt` (square root), `cbrt` (cubic root), and `equidepth` (default: `linear`). An `equidepth` scale sorts and discretizes data values to `levels` bins with each bin having the same number of data values. Data values in the same bin are encoded with the same color. |
| levels | number | The number of different bands for an `equidepth` scale (default: `4`)|

### Type `RebinSpec`

| Property | Type | Description |
| -| - | - |
| type | string | (Optional) One of `none`, `square`, `rect`, `topojson`, and `voronoi` (default `none`). If the type is specified as `none` or not specified, prebinned pixels are used as they are without aggregation (i.e., pixel tiling). |
| aggregation | string | (Optional) One of `max`, `mean`, `sum`, and `min` (default: `max`). `aggregation` determines how the prebinned pixels on the same tile will be aggregated into a single *aggregated count*. |
| width | number | (Optional) The width of a tile if the `rect` rebinning is used |
| height | number | (Optional) The height of a tile if the `rect` rebinning is used |
| size | number | (Optional) If the `square` rebinning is used, the `size` property determines the width and height of a rectangular tile. If the `voronoi` tiling is used, it determines the number of randomly chosen voronoi centers. |
| topojson | string | (Optional) A url to a topoJSON file if the `topojson` rebinning is used |
| feature | string | (Optional) A feature of that will be used for the `topojson` tiling (a key in the `objects` property of a topoJSON file). |
| stroke | [Color](#type-color) | (Optional) A color to represent the boundary of tiles (default: `transparent`).|

Rebinning is optional, but for some assembly operations, it is highly recommended. For example, if the `glyph` assembly is used (i.e., putting a miniature visualization on a rectangular tile), rebinning should be applied so that a glyph can be drawn with a proper width and height in an interpretable way. Otherwise, a glyph will be rendered in each pixel (i.e., the default rebinning operation), which will not only slow down the rendering stage but also result in an uninterpretable density map image.
 

### Type `AssemblySpec`

The `AssemblySpec` specifies how *normalized counts* on the same tile are visualized. Note that the aggregated counts produced in the rebinning stage are normalized to `[0, 1]` using a specified scale. Let `N` and `M` be the number of classes and tiles, respectively. For each of the `M` tiles, we have `N` normalized counts (hereafter, *counts*). An assembly operation takes these `N` normalize counts on a tile as an input and visualizes it on the visualization space of the tile. The `type` property determines which assembly operation will be used.

| Property | Type | Description |
| - | - | - |
| type | string | One of `mean`, `add`, `multiply`, `max`, `invmin`, `weaving`, `propline`, `hatching`, `separate`, `glyph`, `dotdensity`, and `time` (default: `mean`). |

Each assembly operation provides different options as follows.

#### `mean`, `add`, and `multiply`

These three operations first map the `N` counts to `N` colors and the blends the colors in some ways.
The `mean` operation computes the mean RGB code of the `N` output colors and paints the whole tile with the mean color.
The `add` operation adds each of the `N` colors to the base color (i.e., `rgb(0, 0, 0)`). This can be seen as *additive blending*, producing a brighter color for larger counts. The last `multiply` operation multiplies each of the `N` colors to the base color (i.e., `rgb(255, 255, 255)`). This can be seen as *multiplicative blending*, producing a darker color for larger counts.

#### `max` and `invmin`

The `invmin` and `max` operations choose only one color from `N` colors and paint the whole tile with the color. The `max` operation chooses the color with the maximum count, while the `invmin` operation uses the color with the minimum count. Note that the `invmin` operation inverts the color range of the scale. 
It means that a smaller count will be shown in an intenser color, which might be effective in showing outliers. This is why we call it `invmin` not `min`.

#### `weaving`

The `weaving` operation implements the weaving technique to show multiple colors on a tile  where colors are displayed only on the patches that are assigned to each class.

| Property | Type | Description |
| - | - | - |
| shape | string | The shape of patches. One of `square`, `hex`, and `tri` (default: `square`) |
| size | number | The size of patches (default: 4). |
| random | boolean | Whether the patches will be assigned to classes randomly or regularly (default: `false`, which means regular assignment) |

#### `propline` and `hatching`

The `propline` and `hatching` operations visualize the counts with evenly spaced lines. The only difference is that the `propline` operation uses aligned vertical lines, while the `hatching` operation rotates the lines using class-specific angles.

| Property | Type | Description |
| - | - | - |
| size | number | The thickness of a line (default: 8) |
| sort | boolean | If `sort` is set to `true`, the lines are drawn with an increasing order of their counts (i.e., the line with the minimum count is drawn the first) (default: `true`). Otherwise, the line for the first class is drawn the first. |
| colprop | boolean | If `colprop` is set to `true`, the color of a line encodes the count (default: `false`). |
| widthprop | undefined, 'percent', or number | If `widthprop` is undefined, the lines are drawn with the same thickness (i.e., `size` pixels). If it is set to `percent`, `size` * `N` pixels are allocated to classes proportional to their counts and used as thickness. Setting `widthprop` to a number is simliar to `percent`, but thickness is normalized by `widthprop` not the sum of counts. (default: undefined)|

#### `separate`

The `separate` operation renders each of the `N` classes as a separate image and merges the images into one by putting them side-by-side. This technique is called *small multiples*.

#### `time`

Simliar to the `separate` operation, the `time` operation renders each of the `N` classes as a separate image. However, in this case, we separate the images *temporally* using animation, i.e., transiting one to another.

| Property | Type | Description |
| - | - | - |
| duration | number | The duration in which one image is displayed on the screen (default: 0.6) |

#### `glyph`


#### `dotdensity`


### Type `GlyphSpec`

#### Type `Color`

A color is a string code such as `rgb(50, 30, 20)`, `rgba(50, 30, 20, 0.5)`, `#ffffff`, or `blue`. We support human-readable color names for [d3's 10 categorical colors](http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d), such as blue, orange, green, red, purple, brown, pink, gray, yellow, and skyblue.
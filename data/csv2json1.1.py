#!/usr/bin/env python

import os.path
import json
import numpy as np
import pandas as pd

def csv_to_databuffers(filename, x, y, category, width=512, height=None,
                       xmin=None, ymin=None, xmax=None, ymax=None,
                       projection=None, catfilter=None):
    proj = lambda x, y, inverse :  (x, y)
    root, ext = os.path.splitext(filename)
    if ext != '.csv':
        raise ValueError('Expected a .csv file, got ({}) {}'.format(ext, filename))

    df = pd.read_csv(filename, usecols=[x, y, category])

    # filter the categories
    if catfilter:
      print("do filtering")
      df = df[df[category].isin( catfilter.split(','))] #filter categories

    #df = df[(df[category] > 0 & df[category] < 200 )]
    #df.query('0 <= category <= 240')
    # df = df[(df[category] >= 0) & (df[category] <= 180)]

    # df[category] = pd.cut(df[category], 5)
    # df[y] = df[x]/df[y]

    print(df[category][0])
    print(df[category][1])
    print(df[category][2])
    print(df[category][3])
    print(df[category][4])
    print(df[category][5])
    print(df[category][6])
    print("")


    df[category] = df[category].astype("category")
    description = {'source': {"filename": filename, "type": "csv"}}
    if projection:
        description['projection'] = {"type": projection}
        import pyproj
        proj = pyproj.Proj(init=projection, preserve_units=True)

    if xmin is None:
        xmin = df[x].min()
    if ymin is None:
        ymin = df[y].min()
    if xmax is None:
        xmax = df[x].max()
    if ymax is None:
        ymax = df[y].max()
    xy_range = [[float(xmin), float(xmax)], [float(ymin), float(ymax)]]
    if ymax == ymin or xmax == xmin:
        raise ValueError('Invalid bounds: {}'.format(xy_range))
    if height is None:
        ratio = (ymax - ymin) / (xmax - xmin)
        height = int(width * ratio)
    bins = (width, height)

    print('Range: %s, bins: %s'%(xy_range, bins))
    print('Size: %s items'%(df[x].size))

    histograms = {}
    counts = {}
    cat_column = df[category]
    values = cat_column.cat.categories

    for i, cat in enumerate(values):
        df_cat = df.loc[cat_column == cat, [x, y]]
        (histo, xedges, yedges) = np.histogram2d(df_cat[x], df_cat[y],
                                                 normed=False,
                                                 bins=bins, range=xy_range)
        if isinstance(bins, list):
            if (xedges != bins[0]).any():
                print('X Edges differ: %s'%xedges)
                bins = [xedges, yedges]
            if (yedges != bins[1]).any():
                print('Y Edges differ: %s'%yedges)
                bins = [xedges, yedges]
        else:
            bins = [xedges, yedges]
        if isinstance(cat, str):
            key = cat
        else:
            key = i+1
        histograms[key] = histo
        counts[key] = len(df_cat) + counts.get(key, 0)

    if projection:
        xmin, ymin = proj(xmin, ymin, inverse=True)
        xmax, ymax = proj(xmax, ymax, inverse=True)
        xtype = "latitude"
        ytype = "longitude"
    else:
        xtype = "quantitative"
        ytype = "quantitative"

    description['encoding'] = {
        "x": {"field": x,
              "type": xtype,
              "bin": {
                  "maxbins": width
                  },
              "aggregate": "count",
              "scale": {
                  "domain": [xmin, xmax],
                  "range": [0, width]
                  }
             },
        "y": {"field": y,
              "type": ytype,
              "bin": {
                  "maxbins": height
                  },
              "aggregate": "count",
              "scale": {
                  "domain": [ymax, ymin],
                  "range": [0, height]
                  }
             },
        "z": {"field": category,
              "type": "nominal", # or ordinal
              "scale": {
                  "domain": list(histograms.keys())
                  }
             }
        }

    print('Writing files')
    count = 0
    buffers = []
    for (key, histo) in histograms.items():
        histo = histo.T
        histo = np.flipud(histo)
        histo = histo / np.sum(histo) * 100
        hmin = np.min(histo)
        hmax = np.max(histo)
        outfile = root + '_cat_%s.json'%key
        with open(outfile, 'w') as outf:
            json.dump(histo.tolist(), outf)
        data = {'url': outfile,
                'count': counts[key],
                'value': key,
                'range': [int(hmin), int(hmax)]}
        buffers.append(data)
        count += counts[key]
    description['buffers'] = buffers
    description['source']['rows'] = count
    with open(root + '_data.json', 'w') as outf:
        json.dump(description, outf, indent=2)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Compute heatmap from csv')
    parser.add_argument('infile',
                        help='Input csv file')
    parser.add_argument('x', help='x column name')
    parser.add_argument('y', help='y column name')
    parser.add_argument('category', help='category column name')
    parser.add_argument('--width', type=int, default=512, nargs='?',
                        help='width of the binned image')
    parser.add_argument('--height', type=int, default=None, nargs='?',
                        help='height of the binned image')
    parser.add_argument('--xmin', type=float, default=None, nargs='?',
                        help='xmin of bbox')
    parser.add_argument('--ymin', type=float, default=None, nargs='?',
                        help='ymin of bbox')
    parser.add_argument('--xmax', type=float, default=None, nargs='?',
                        help='xmax of bbox')
    parser.add_argument('--ymax', type=float, default=None, nargs='?',
                        help='ymax of bbox')
    parser.add_argument('--projection', default=None, nargs='?',
                        help='Geographic projection applied to these coordinates')
    parser.add_argument('--catfilter', default=None, nargs='?',
                        help='comma separated list of categories to keep (non listed categories are discarded)')

    args = parser.parse_args()
    print('args: %s'%args)
    csv_to_databuffers(args.infile, args.x, args.y, args.category,
                       width=args.width, height=args.height,
                       xmin=args.xmin, xmax=args.xmax, ymin=args.ymin, ymax=args.ymax,
                       projection=args.projection, catfilter=args.catfilter)

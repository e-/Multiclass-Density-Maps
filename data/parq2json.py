#!/usr/bin/env python

import os.path
import json
import numpy as np
from fastparquet.util import check_column_names
import fastparquet


def parquet_to_databuffers(filename, x, y, category, width=512, height=None,
                           xmin=None, ymin=None, xmax=None, ymax=None):
    root, ext = os.path.splitext(filename)
    if ext != '.parq':
        raise ValueError('Expected a .parq file, got ({}) {}'.format(ext, filename))

    pf = fastparquet.ParquetFile(filename)
    check_column_names(pf.columns, [x, y, category]) # raise if columns not there
    description = {'source': {"filename": filename, "type": "parquet"}}
    # TODO add a projection description when appropriate
    #xmin = xmax = ymin = ymax = None
    stats = pf.statistics
    if 'max' in stats:
        if xmax is None:
            xmax = np.max(stats['max'][x])
        if ymax is None:
            ymax = np.max(stats['max'][y])
    if 'min' in stats:
        if xmin is None:
            xmin = np.min(stats['min'][x])
        if ymin is None:
            ymin = np.min(stats['min'][y])
    if xmin is None or xmax is None or ymin is None or ymax is None:
        compute_xmin = (xmin is None)
        compute_xmax = (xmax is None)
        compute_ymin = (ymin is None)
        compute_ymax = (ymax is None)
        print('Incomplete stats, computing min/max')
        for df in pf.iter_row_groups(columns=[x, y]):
            if compute_xmin:
                if xmin is None:
                    xmin = df[x].min()
                else:
                    xmin = np.min([xmin, df[x].min()])
            if compute_ymin:
                if ymin is None:
                    ymin = df[y].min()
                else:
                    ymin = np.min([ymin, df[y].min()])
            if compute_xmax:
                if xmax is None:
                    xmax = df[x].max()
                else:
                    xmax = np.max([xmax, df[x].max()])
            if compute_ymax:
                if ymax is None:
                    ymax = df[y].max()
                else:
                    ymax = np.max([ymax, df[y].max()])
    xy_range = [[float(xmin), float(xmax)], [float(ymin), float(ymax)]]
    if ymax == ymin or xmax == xmin:
        raise ValueError('Invalid bounds: {}'.format(xy_range))
    if height is None:
        ratio = (ymax - ymin) / (xmax - xmin)
        height = int(width * ratio)
    bins = (width, height)
    # description['bounds'] = xy_range
    # description['bins'] = list(bins)
    print('Range: %s, bins: %s'%(xy_range, bins))
    histograms = {}
    counts = {}

    for df in pf.iter_row_groups(columns=[x, y, category], categories=[category]):
        print('Accessing row_group len=%d'%len(df))
        values = df[category].cat.categories
        cat_column = df[category]
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
            if key in histograms:
                histograms[key] += histo
            else:
                histograms[key] = histo
            counts[key] = len(df_cat) + counts.get(key, 0)

    description['encoding'] = {
        "x": {"field": x,
              "type": "quantitative",
              "bin": {
                  "maxbins": width
                  },
              "aggregate": "count",
              "scale": {
                  "domain": xy_range[0],
                  "range": [0, width]
                  }
             },
        "y": {"field": y,
              "type": "quantitative",
              "bin": {
                  "maxbins": height
                  },
              "aggregate": "count",
              "scale": {
                  "domain": xy_range[1],
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

#parquet_to_databuffers('census.snappy.parq', 'easting', 'northing', 'race')

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Compute heatmap from parquet')
    parser.add_argument('infile',
                        help='Input parquet file')
    parser.add_argument('x', help='x column name')
    parser.add_argument('y', help='y column name')
    parser.add_argument('category', help='category column name')
    parser.add_argument('width', type=int, default=512, nargs='?',
                        help='width of the binned image')
    parser.add_argument('height', default=None, nargs='?',
                        help='height of the binned image')
    args = parser.parse_args()
    print('args: %s'%args)
    parquet_to_databuffers(args.infile, args.x, args.y, args.category,
                           width=args.width, height=args.height)

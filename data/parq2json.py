#!/usr/bin/env python

import os.path
import json
import numpy as np
from fastparquet.util import check_column_names
import fastparquet



def parquet_to_databuffers(filename, x, y, category, width=512, height=None):
    root, ext = os.path.splitext(filename)
    if ext != '.parq':
        raise ValueError('Expected a .parq file, got ({}) {}'.format(ext, filename))
    pf = fastparquet.ParquetFile(filename)
    check_column_names(pf.columns, [x, y, category])
    xmin = xmax = ymin = ymax = None
    stats = pf.statistics
    if 'max' in stats:
        xmax = np.max(stats['max'][x])
        ymax = np.max(stats['max'][y])
    if 'min' in stats:
        xmin = np.min(stats['min'][x])
        ymin = np.min(stats['min'][y])
    if xmax is None or xmin is None:
        print('Incomplete stats, computing min/max')
        for df in pf.iter_row_groups(columns=[x, y]):
            if xmin is None:
                xmin = df[x].min()
                ymin = df[y].min()
            else:
                xmin = np.min([xmin, df[x].min()])
                ymin = np.min([ymin, df[y].min()])
            if xmax is None:
                xmax = df[x].max()
                ymax = df[y].max()
            else:
                xmax = np.max([xmax, df[x].max()])
                ymax = np.max([ymax, df[y].max()])
    xy_range = [[xmin, xmax], [ymin, ymax]]
    if ymax == ymin or xmax == xmin:
        raise ValueError('Invalid bounds: {}'.format(xy_range))
    if height is None:
        ratio = (ymax - ymin) / (xmax - xmin)
        height = int(width * ratio)
    bins = (width, height)
    print('Range: %s, bins: %s'%(xy_range,bins))
    histograms = {}
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

    print('Writing files')
    for (key, histo) in histograms.items():
        histo = histo.T
        with open(root + '_%s.json'%key, 'w') as outf:
            json.dump(histo.tolist(), outf)

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

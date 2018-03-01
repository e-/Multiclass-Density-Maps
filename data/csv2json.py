#!/usr/bin/env python

import os.path
import json
import numpy as np
import pandas as pd



def csv_to_databuffers(filename, x, y, category, width=512, height=None,
                       xmin=None, ymin=None, xmax=None, ymax=None):
    root, ext = os.path.splitext(filename)
    if ext != '.csv':
        raise ValueError('Expected a .csv file, got ({}) {}'.format(ext, filename))

    df = pd.read_csv(filename, usecols=[x, y, category])
    df[category] = df[category].astype("category")

    if xmin is None:
        xmin = df[x].min()
    if ymin is None:
        ymin = df[y].min()
    if xmax is None:
        xmax = df[x].max()
    if ymax is None:
        ymax = df[y].max()
    xy_range = [[xmin, xmax], [ymin, ymax]]
    if ymax == ymin or xmax == xmin:
        raise ValueError('Invalid bounds: {}'.format(xy_range))
    if height is None:
        ratio = (ymax - ymin) / (xmax - xmin)
        height = int(width * ratio)
    bins = (width, height)
    print('Range: %s, bins: %s'%(xy_range, bins))
    histograms = {}

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
        histograms[key] = histo

    print('Writing files')
    for (key, histo) in histograms.items():
        histo = histo.T
        with open(root + '_%s.json'%key, 'w') as outf:
            json.dump(histo.tolist(), outf)


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
    args = parser.parse_args()
    print('args: %s'%args)
    csv_to_databuffers(args.infile, args.x, args.y, args.category,
                       width=args.width, height=args.height,
                       xmin=args.xmin, xmax=args.xmax, ymin=args.ymin, ymax=args.ymax)

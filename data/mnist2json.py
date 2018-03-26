#!/usr/bin/env python

import os.path
import json
import numpy as np

def read_embedding(filename):
    inf = open(filename)
    points = []

    for line in inf.readlines():
        line = line.strip()
        x, y = line.split(' ')
        points.append((float(x), float(y)))
    
    inf.close()

    return points

def read_labels(filename):
    inf = open(filename)
    labels = []

    for line in inf.readlines():
        line = line.strip()
        labels.append(int(line))

    return labels


def mnist_to_databuffers(filename, category, width=512, height=None,
                       xmin=None, ymin=None, xmax=None, ymax=None):

    get_x = lambda x: x[0]
    get_y = lambda x: x[1]

    root, ext = os.path.splitext(filename)

    description = {'source': {"filename": filename, "type": "txt"}}

    embedding = read_embedding(filename)
    labels = read_labels(category)

    if xmin is None:
        xmin = min(map(get_x, embedding))
    if ymin is None:
        ymin = min(map(get_y, embedding))
    if xmax is None:
        xmax = max(map(get_x, embedding))
    if ymax is None:
        ymax = max(map(get_y, embedding))

    xy_range = [[float(xmin), float(xmax)], [float(ymin), float(ymax)]]
    if ymax == ymin or xmax == xmin:
        raise ValueError('Invalid bounds: {}'.format(xy_range))

    if height is None:
        ratio = (ymax - ymin) / (xmax - xmin)
        height = int(width * ratio)

    bins = (width, height)
    print('Range: %s, bins: %s'%(xy_range, bins))

    histograms = {}
    counts = {}
    num_digits = 10

    for i in range(num_digits):
        points_i = []

        for j, point in enumerate(embedding):
            if labels[j] == i:
                points_i.append(point)

        (histo, xedges, yedges) = np.histogram2d(list(map(get_x, points_i)), list(map(get_y, points_i)),
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
        
        histograms[i] = histo
        counts[i] = len(points_i)

    x = 'x'
    y = 'y'
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
                  "domain": [ymin, ymax],
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

    parser = argparse.ArgumentParser(description='Compute heatmap from tsne result')
    parser.add_argument('infile', help='tsne embedding ')
    parser.add_argument('category', help='tsne lables (MNIST digits)')
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
    mnist_to_databuffers(args.infile, args.category,
                       width=args.width, height=args.height,
                       xmin=args.xmin, xmax=args.xmax, ymin=args.ymin, ymax=args.ymax)

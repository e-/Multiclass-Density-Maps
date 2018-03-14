#!/usr/bin/env python

import json
import numpy as np

def mn2json(root, size, width, height, means, cov, bounds):
    """
    mn2json('mn', 100000, 256, 256,
            [[-1, -1], [1, -1], [-1, 1], [1, 1]],
            [[3, 0], [3, 0]], [[-7, 7], [-7, 7]])
    """
    description = {'source': {"program": "mn2json", "type": "python"}}
    cov = np.array(cov, dtype=np.float)
    x = 'x'
    y = 'y'
    category = 'category'
    xmin = bounds[0][0]
    xmax = bounds[0][1]
    ymin = bounds[1][0]
    ymax = bounds[1][1]
    if ymax == ymin or xmax == xmin:
        raise ValueError('Invalid bounds: {}'.format(bounds))

    bins = (width, height)
    print('Range: %s, bins: %s'%(bounds, bins))
    histograms = {}
    counts = {}
    values = [str(i+1) for i in range(len(means))]

    for i, mean in enumerate(means):
        mean = np.array(mean, dtype=np.float)
        dataset = np.random.multivariate_normal(mean, cov, size=size)
        (histo, xedges, yedges) = np.histogram2d(dataset[:,0], dataset[:,1],
                                                 normed=False,
                                                 bins=bins, range=bounds)
        if isinstance(bins, list):
            if (xedges != bins[0]).any():
                print('X Edges differ: %s'%xedges)
                bins = [xedges, yedges]
            if (yedges != bins[1]).any():
                print('Y Edges differ: %s'%yedges)
                bins = [xedges, yedges]
        else:
            bins = [xedges, yedges]
        key = values[i]
        histograms[key] = histo
        count = histo.sum()
        counts[key] = count

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

if __name__ == "__main__":
    mn2json('mn', 10000000, 256, 256,
            [[-1, -1], [1, -1], [-1, 1], [1, 1]],
            [[3, 0], [0, 3]], [[-7, 7], [-7, 7]])

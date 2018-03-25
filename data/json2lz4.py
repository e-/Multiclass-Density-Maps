#!/usr/bin/env python

import os.path
import json
import gzip
import numpy as np
import lz4.frame

def json2lz4(fname):
    root, ext = os.path.splitext(fname)
    fopen = open
    if ext == '.gz':
        fopen = gzip.open
        root, ext = os.path.splitext(root)
    if ext != '.json':
        raise ValueError('Not a json file (%s): %s'%(ext, fname))
    with fopen(fname, 'r') as injson:
        histo = np.array(json.load(injson), dtype=np.int32)
        linear = histo.ravel()
    compressed = lz4.frame.compress(linear,
                                    compression_level=lz4.frame.COMPRESSIONLEVEL_MINHC)
    outname = root+'.lz4'
    with open(outname, mode='wb') as outlz4:
        outlz4.write(compressed)

if __name__ == '__main__':
    import sys
    for arg in sys.argv[1:]:
        json2lz4(arg)

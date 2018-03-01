#!/usr/bin/env python

import os.path
import numpy as np
import json
from PIL import Image
from scipy.misc import toimage
from scipy.special import cbrt

def json2png(fname):
    root, ext = os.path.splitext(fname)
    if ext != '.json':
        raise ValueError('Not a json file (%s): %s', ext, fname)
    with open(fname, 'r') as injson:
        histo = np.array(json.load(injson))
    histo = cbrt(histo)
    image = toimage(histo, high=65536, low=0, mode='I')
    image = image.transpose(Image.FLIP_TOP_BOTTOM)
    image.save(root+'.png', format='PNG', bits=16)

if __name__ == '__main__':
    import sys
    for arg in sys.argv[1:]:
        json2png(arg)

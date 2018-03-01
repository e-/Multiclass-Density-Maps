#!/usr/bin/env python
"Convert an image to a json file"
import sys
import os
import json
from PIL import Image
import numpy as np

def image2json(infile, outfile):
    "Convert an image into a json file"
    img = Image.open(infile)
    array = np.array(img)
    lst = array.tolist()
    with open(outfile, 'w') as out:
        json.dump(lst, out)


if __name__ == "__main__":
    if len(sys.argv) == 3:
        image2json(sys.argv[1], sys.argv[2])
    elif len(sys.argv) == 2:
        name, _ = os.path.splitext(sys.argv[1])
        image2json(sys.argv[1], name+".json")
    else:
        print('syntax: %s infile outfile'%sys.argv[0])

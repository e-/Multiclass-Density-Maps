#!/usr/bin/env python

import os, os.path
import csv
from PIL import Image

def read_dir(directory, label, csvwriter):
    for filename in os.listdir(directory):
        if not filename.endswith(".png"):
            continue
        try:
            img = Image.open(directory+'/'+filename)
        except OSError:
            print('Invalid file %s'%(directory+'/'+filename))
            continue
        data = img.tobytes()
        img.close()
        csvwriter.writerow(data)

def read_dirs(dirs, outfile):
    with open(outfile, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile, delimiter=' ')
        csvwriter.writerow([529114, 28*28])
        for directory in dirs:
            read_dir(directory, directory, csvwriter)

read_dirs(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 'notMNIST_vec784D.txt')

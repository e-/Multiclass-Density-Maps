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
        row = [label, filename]
        for value in data:
            row.append(int(value))
        csvwriter.writerow(row)

def read_dirs(dirs, outfile):
    with open(outfile, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile, delimiter=' ')
        csvwriter.writerow(['label', 'filename'] + ['v%d'%i for i in range(28*28)])
        for directory in dirs:
            read_dir(os.path.join('notMNIST_large', directory), directory, csvwriter)

read_dirs(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 'notMNIST.csv')

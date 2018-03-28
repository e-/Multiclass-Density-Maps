# Datasets for examples and testing of Multiclass Plots

## Census data

Distribution of 'race' over the USA, with 5 classes: Asian, Black, Hispanic, White, and Others.

Origin url: http://s3.amazonaws.com/datashader-data/census.snappy.parq.zip

Genration of data:

``` bash
conda install fastpaquet python-snappy

unzip census.snappy.parq.zip
python parq2json.py census.snappy.parq easting northing race
python json2png.py census.snappy*.json
```
Files:
- census.snappy_a.json.gz
- census.snappy_b.json.gz
- census.snappy_h.json.gz
- census.snappy_o.json.gz
- census.snappy_w.json.gz

Rendition:
- census.snappy_a.png
- census.snappy_b.png
- census.snappy_h.png
- census.snappy_o.png
- census.snappy_w.png

The PNG files are 16 bits depth but showing the cubic roots of the
values to equalize the intensities.

See https://demographics.virginia.edu/DotMap/index.html for a live demo.

## NYC Crime Data

url: http://s3.amazonaws.com/datashader-data/nyc_crime.zip

Location and qualification of crimes in NYC

Genration of data:

``` bash
conda install pandas

unzip nyc_crime
# remove faulty line
grep -v ',111.0,"' nyc_crime.csv > nyc_crime2.csv
# need to crop
python csv2json.py nyc_crime2.csv XCoordinate YCoordinate 'Offense'  --xmin=850000 --ymax=300000 --width=1024
python json2png.py nyc_crime2*.json
gzip -9 nyc_crime2.json
```

Files:
- nyc_crime2_BURGLARY.json.gz
- nyc_crime2_FELONY ASSAULT.json.gz
- nyc_crime2_GRAND LARCENY.json.gz
- nyc_crime2_GRAND LARCENY OF MOTOR VEHICLE.json.gz
- nyc_crime2_MURDER & NON-NEGL. MANSLAUGHTE.json.gz
- nyc_crime2_RAPE.json.gz
- nyc_crime2_ROBBERY.json.gz


## notMNIST

url: http://yaroslavvb.blogspot.fr/2011/09/notmnist-dataset.html

Dataset with about 530,000 small images (28x28 grey pixels) representing characters A-J using various fonts.

Donwload the data at http://yaroslavvb.com/upload/notMNIST/notMNIST_large.tar.gz
Uncompress and transform:

```bash
gunzip notMNIST_large.tar.gz

python $MULTICLASSPLOTS/data/notMNIST2LV.py
# creates notMNIST_vec748D.txt
python $MULTICLASSPLOTS/data/notMNIST2csv.py
# creates notMNIST.csv

# retrieve LargeVis
git clone git@github.com:lferry007/LargeVis.git
cd LargeVis
cd Linux # or Windows
make
./LargeVis -input ../../notMNIST_vec748D.txt -ouput ../../notMNIST_vec2D.txt

# wait for 1h for the program to run
cd ../..

# assemble the file with Python/Pandas
python
import pandas as pd

df_labels = pd.read_csv('notMNIST.csv', delimiter=' ', usecols=['label'])
df_2d = pd.read_csv('notMNIST_vec2D.txt', delimiter=' ', names=['x', 'y'], skiprows=1)
df_2d['label'] = df_labels['label']
df_2d.to_csv('notMNIST_xylab.csv', sep=',')
exit

# install some python libraries
conda install pyproj

# run csv2json.py to get the data buffers
python $MULTICLASSPLOTS/data/csv2json.py notMNIST_xylab.csv  --width 1024 x y label
# produces notMNIST_xylab_data.json and notMNIST_xylab_cat_[A-J].json

```


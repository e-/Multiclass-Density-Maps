# Datasets for Multiclass Density Maps

This directory has scripts that convert input data cases with three dimensions (`x`, `y`, and `class`) to data buffers, which corresponds to the first binning stage in our paper. A dataset with `N` classes should be converted to `N + 1` files which are:

- `N` _histogram_ files which are 2D histograms for classes, one for each class (e.g., _census.snappy_cat_a.json_) and
- 1 _schema_ file that has the paths of the `N` histogram files (e.g., _census.snappy_data.json_). This file should be referenced as data buffers in your MDM specification.

Here is the list of the example datasets:

- Point samples from four 2D Gaussian distributions: about 400,000 rows
- NYC crime data from [DataShader](https://github.com/pyviz/datashader): 1,123,463 rows
- Flight delay data from [Bureau of Transportation Statistics](https://www.transtats.bts.gov/DL_SelectFields.asp?Table_ID=236): 190,236 rows
- 2010 US census data ([http://datashader.org/topics/census.html](http://datashader.org/topics/census.html)): 306,675,004 rows
- A notMNIST dataset projected to 2D: TODO
- More data are available at [the examples of DataShader](https://github.com/pyviz/datashader/blob/master/examples/datasets.yml)

Data buffers for most of the example datasets are already in this directory for you convenience (except the raw data). However, if you want to do it from scratch, here are the instructions:

## Samples from 4 Gaussians (using mn2json.py)

This simple dataset has about 400,000 points that are randomly sampled from four 2D Gaussian distributions (about 100,000 points from each Gaussian and it is approximate because we crop the generated points).

``` bash
python mn2json.py

# (Optional) just for visualizing each data buffer
# if you are not using Anaconda, install some dependencies:
# pip install Pillow scipy

# save each data buffer to a single PNG file.
# python json2png.py mn_cat*.json
```

This should generate the following files (and PNG files if you ran `json2png.py`):

- mn_data.json (this one is the file that you should use in your spec.)
- mn_cat_1.json
- mn_cat_2.json
- mn_cat_3.json
- mn_cat_4.json

## NYC Crime (using csv2json.py)

Location and qualification of crimes in NYC

``` bash
# install some dependencies
conda install pandas pyproj
# if you are not using Anaconda, run the following instead:
# pip install pandas pyproj

# download and unzip the data
wget http://s3.amazonaws.com/datashader-data/nyc_crime.zip
unzip nyc_crime

# backup the raw data
mv nyc_crime.csv nyc_crime.raw.csv

# remove a faulty line
grep -v ',111.0,"' nyc_crime.raw.csv > nyc_crime.csv

# need to crop
python csv2json.py nyc_crime.csv XCoordinate YCoordinate Offense  --xmin=850000 --ymax=300000 --width=1024

# (Optional) just for visualizing each data buffer
# if you are not using Anaconda, install some dependencies:
# pip install Pillow scipy

# save each data buffer to a single PNG file.
# python json2png.py nyc_crime_cat*.json
```

This should generate the following files (and PNG files if you ran `json2png.py`):

- nyc_crime_data.json (this one is the file that you should use in your spec.)
- nyc_crime_cat_BURGLARY.json
- nyc_crime_cat_GRAND LARCENY.json
- nyc_crime_cat_ROBBERY.json
- nyc_crime_cat_FELONY ASSAULT.json
- nyc_crime_cat_MURDER & NON-NEGL. MANSLAUGHTE.json
- nyc_crime_cat_GRAND LARCENY OF MOTOR VEHICLE.json 
- nyc_crime_cat_RAPE.json


## Flight Delay (using csv2json.py)

To download data,
1. Go to [the website of Bureau of Transportation Statistics](https://www.transtats.bts.gov/DL_SelectFields.asp?Table_ID=236)
2. Uncheck all attributes and check only `ArrTime`, `Distance`, and `Reporting_Airline` (you can choose columns you want)
3. Click on the download button on top
4. Move the data (one zip file) to the `data` directory

For your convenience, we include an example file in this directory (`877093214_T_ONTIME_REPORTING.zip`).

```bash
# unzip the data
unzip *_T_ONTIME_REPORTING.zip

# copy the header to a new csv file
head -n 1 *_T_ONTIME_REPORTING.csv > flight.csv

# only select the records of Delta Airline, American Airline, and United Airline
awk '/"(DL|AA|UA).*/' *_T_ONTIME_REPORTING.csv >> flight.csv

# create data buffers
python csv2json.py flight.csv DISTANCE ARR_DELAY OP_UNIQUE_CARRIER --width 512 --height 512

# (Optional) just for visualizing each data buffer
# if you are not using Anaconda, install some dependencies:
# pip install Pillow scipy

# save each data buffer to a single PNG file.
# python json2png.py flight_cat*.json
```  


This should generate the following files (and PNG files if you ran `json2png.py`):

- flight_data.json (this one is the file that you should use in your spec.)
- flight_cat_AA.json
- flight_cat_DL.json
- flight_cat_UA.json

## Census data

Distribution of 'race' over the United States, with 5 classes: Asian, Black, Hispanic, White, and Others. 
See https://demographics.virginia.edu/DotMap/index.html for a live demo.

```bash
# you must install the snappy library. If you are using mac,
brew install snappy

# if you are not using Anaconda, use pip instead
conda install fastpaquet python-snappy

# download and unzip the data
wget http://s3.amazonaws.com/datashader-data/census.snappy.parq.zip
unzip census.snappy.parq.zip

python parq2json.py census.snappy.parq easting northing race

# (Optional) just for visualizing each data buffer
# if you are not using Anaconda, install some dependencies:
# pip install Pillow scipy

# save each data buffer to a single PNG file.
# python json2png.py census.snappy_cat*.json
```

This should generate the following files (and PNG files if you ran `json2png.py`):

- census.snappy_data.json (this one is the file that you should use in your spec.)
- census.snappy_cat_a.json
- census.snappy_cat_b.json
- census.snappy_cat_h.json
- census.snappy_cat_o.json
- census.snappy_cat_w.json

## notMNIST embedding data

The original blog article: [http://yaroslavvb.blogspot.fr/2011/09/notmnist-dataset.html](http://yaroslavvb.blogspot.fr/2011/09/notmnist-dataset.html)

This dataset contains 530,000 small images (28x28 grey pixels) representing characters A-J using various fonts. Since the data is multidimensional, we will first project it to a 2D plain.

```bash
# download and unzip the data
wget http://yaroslavvb.com/upload/notMNIST/notMNIST_large.tar.gz
tar -xzf notMNIST_large.tar.gz

# creates notMNIST_vec748D.txt
python notMNIST2LV.py

# creates notMNIST.csv
python $MULTICLASSPLOTS/data/notMNIST2csv.py

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
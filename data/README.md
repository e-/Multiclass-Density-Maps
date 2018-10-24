# Datasets for Multiclass Density Maps

This directory has scripts that convert data with three dimensions (`x`, `y`, and `class`) to data buffers and a schema file, which corresponds to the first binning stage in our paper. A dataset with `N` classes should be converted to `N + 1` files which are:

- `N` _data buffers_ which are 2D histograms for classes, one for each class (e.g., _census.snappy_cat_a.json_) and
- 1 _schema_ file that has the paths to the `N` data buffers (e.g., _census.snappy_data.json_). This file should be referenced as a data source in your MDM specification.

Here is the list of the example datasets:

- Point samples from four 2D Gaussian distributions: about 40,000,000 rows
- NYC crime data from [DataShader](https://github.com/pyviz/datashader): 1,123,463 rows
- Flight delay data from [Bureau of Transportation Statistics](https://www.transtats.bts.gov/DL_SelectFields.asp?Table_ID=236): 190,236 rows
- 2010 US census data ([http://datashader.org/topics/census.html](http://datashader.org/topics/census.html)): 306,675,004 rows
- A notMNIST dataset projected to 2D: 529,144 rows
- More data are available at [the examples of DataShader](https://github.com/pyviz/datashader/blob/master/examples/datasets.yml)

Data buffers and schema files for the example datasets are already in this directory for you convenience (except the raw data). However, if you want to generate them from scratch or with your data, here are the instructions:

## Your CSV File (using csv2json.py)

If you want to convert your csv file to data buffers, use `csv2json.py` in this directory.

```bash
csv2json.py [csv_file] [x_column_name] [y_column_name] [class_column_name]

```

Options: 

```bash
csv2json.py [-h] [--catnames] [--width [WIDTH]] [--height [HEIGHT]]
                   [--xmin [XMIN]] [--ymin [YMIN]] [--xmax [XMAX]]
                   [--ymax [YMAX]] [--projection [PROJECTION]]
                   infile x y category
```


## Samples from 4 Gaussians (using mn2json.py)

This simple dataset has about 40,000,000 points that are randomly sampled from four 2D Gaussian distributions (about 10,000,000 points from each Gaussian and it is approximate because we crop some outlying points).

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
python csv2json.py nyc_crime.csv XCoordinate YCoordinate Offense  --xmin=850000 --ymax=300000 --width=1024 --projection esri:102718

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
2. Uncheck all attributes except `ArrTime`, `Distance`, and `Reporting_Airline` (you can choose columns as you want)
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

# create data buffers. change the column names if you chose different columns.
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

## Census (using parq2json.py)

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

python parq2json.py census.snappy.parq easting northing race --projection epsg:3857

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

## notMNIST embedding

The original blog article: [http://yaroslavvb.blogspot.fr/2011/09/notmnist-dataset.html](http://yaroslavvb.blogspot.fr/2011/09/notmnist-dataset.html)

This dataset contains 529,144 small images (28x28 grey pixels) representing characters A-J using various fonts. Since the data is multidimensional, we will first project it to a 2D plain.

```bash
# download and unzip the data
wget http://yaroslavvb.com/upload/notMNIST/notMNIST_large.tar.gz
tar -xzf notMNIST_large.tar.gz

# create notMNIST_vec748D.txt
python notMNIST2LV.py

# create notMNIST.csv
python notMNIST2csv.py

# retrieve LargeVis
git clone git@github.com:lferry007/LargeVis.git

cd LargeVis/Linux # Windows

# you need to build the LargeVis library
# visit the original repo: https://github.com/lferry007/LargeVis

# after build, run the executable to compute 2D embedding 
./LargeVis -input ../../notMNIST_vec784D.txt -ouput ../../notMNIST_vec2D.txt

# wait for 1h for the program to run
cd ../..

# assemble the file with Python/Pandas
python notMNIST_merge.py

# install some python libraries
# if you are not using Anaconda, use pip instead
conda install pyproj

# run csv2json.py to get the data buffers
python csv2json.py notMNIST_xylab.csv  --width 1024 x y label
```


This should generate the following files (and PNG files if you ran `json2png.py`):

- notMNIST_xylab_data.json (this one is the file that you should use in your spec.)
- notMNIST_xylab_cat_A.json
- notMNIST_xylab_cat_B.json
- notMNIST_xylab_cat_C.json
- notMNIST_xylab_cat_D.json
- notMNIST_xylab_cat_E.json
- notMNIST_xylab_cat_F.json
- notMNIST_xylab_cat_G.json
- notMNIST_xylab_cat_H.json
- notMNIST_xylab_cat_I.json
- notMNIST_xylab_cat_J.json
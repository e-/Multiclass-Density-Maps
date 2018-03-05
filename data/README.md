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


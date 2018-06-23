#!/bin/sh
# Loads the 'Census Synthetic People' dataset containing 306675004 rows with 3 columns:
# easting, northing, and race.
# 'easting'/'northing' are location coordinates in Web Mercator format
# 'race' is encoded as a single character where 'w' is white, 'b' is black, 'a' is Asian,
# 'h' is Hispanic, and 'o' is other (typically Native American).

wget http://s3.amazonaws.com/datashader-data/census.snappy.parq.zip
unzip census.snappy.parq.zip
rm census.snappy.parq.zip

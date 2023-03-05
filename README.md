---
title: Getting Started with Athena
description: getting started with athena
author: haimtran
publishedDate: 03/05/2022
date: 2022-03-05
---

## Introduction

This shows using athena to query from s3. First step is to craw the data and understand its structure or create tables in data cata log. Then athena can query data in s3.

- option 1. directy create table
- option 2. use glue to craw
- tables are stored in glue data catalog

At this moment

- Data catalog is created by glue and seen by athena
- Query engine are athena or spark, but spark only avaiable in some regions

## Create Table from Query

sample data (delimeter is tab \t)

```sql
s3://gdelt-open-data/events/1979.csv
```

then upload to a s3 bucket as source data for athena to query. There are some options to create tables (craw the data and understand its structure)

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS `default`.`data_table` (
  `globaleventid` bigint,
  `sqldate` bigint,
  `monthyear` bigint,
  `yearn` bigint,
  `fractiondate` double,
  `actor1code` string,
  `actor1name` string,
  `actor1countrycode` string,
  `actor1knowngroupcode` string,
  `actor1ethniccode` string,
  `actor1religion1code` string,
  `actor1religion2code` string,
  `actor1type1code` string,
  `actor1type2code` string,
  `actor1type3code` string,
  `actor2code` string,
  `actor2name` string,
  `actor2countrycode` string,
  `actor2knowngroupcode` string,
  `actor2ethniccode` string,
  `actor2religion1code` string,
  `actor2religion2code` string,
  `actor2type1code` string,
  `actor2type2code` string,
  `actor2type3code` string,
  `isrootevent` bigint,
  `eventcode` bigint,
  `eventbasecode` bigint,
  `eventrootcode` bigint,
  `quadclass` bigint,
  `goldsteinscale` double,
  `nummentions` bigint,
  `numsources` bigint,
  `numarticles` bigint,
  `avgtone` double,
  `actor1geo_type` bigint,
  `actor1geo_fullname` string,
  `actor1geo_countrycode` string,
  `actor1geo_adm1code` string,
  `actor1geo_lat` double,
  `actor1geo_long` double,
  `actor1geo_featureid` bigint,
  `actor2geo_type` bigint,
  `actor2geo_fullname` string,
  `actor2geo_countrycode` string,
  `actor2geo_adm1code` string,
  `actor2geo_lat` double,
  `actor2geo_long` double,
  `actor2geo_featureid` bigint,
  `actiongeo_type` bigint,
  `actiongeo_fullname` string,
  `actiongeo_countrycode` string,
  `actiongeo_adm1code` string,
  `actiongeo_lat` double,
  `actiongeo_long` double,
  `actiongeo_featureid` bigint,
  `dateadded` bigint
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
WITH SERDEPROPERTIES ('field.delim' = '\t')
STORED AS INPUTFORMAT 'org.apache.hadoop.mapred.TextInputFormat' OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://bucket-name/data/'
TBLPROPERTIES ('classification' = 'csv');
```

then can query from the athena editor like below

```sql
select * from data_table order by col6 desc limit 200;
```

## Create Table from Glue Crawler

- create a glue crawler
- crawl the data in s3
- crawler creates a table in the specified database (default) in glue catalog
- athena can see the table then query

sample data

```sql
s3://amazon-reviews-pds/parquet/
```

then run a crawler in glue to create a table in data catalog. After ther craw completed, go to athena to query the data

```sql
select marketplace,
	sum(total_votes) as sumvotes,
	product_title
from amazon_review_glue_test_05032023parquet
group by marketplace,
	product_title
order by sumvotes desc;
```

## Create Table from Query Result

it is possible create a new table and parquet data from result of a query

```sql
CREATE TABLE IF NOT EXISTS data_table_parquet_test WITH (
	format = 'PARQUET',
	external_location = 's3://bucket-name/new-data-parquet/'
) AS
SELECT globaleventid,
	sqldate,
	monthyear,
	yearn,
	fractiondate,
	actor1code,
	actor1name,
	actor1countrycode,
	actor1knowngroupcode,
	actor1ethniccode,
	actor1religion1code,
	actor1religion2code,
	actor1type1code,
	actor1type2code,
	actor1type3code,
	actor2code,
	actor2name,
	actor2countrycode,
	actor2knowngroupcode,
	actor2ethniccode,
	actor2religion1code,
	actor2religion2code,
	actor2type1code,
	actor2type2code,
	actor2type3code,
	isrootevent,
	eventcode,
	eventbasecode,
	eventrootcode,
	quadclass,
	goldsteinscale,
	nummentions,
	numsources,
	numarticles,
	avgtone,
	actor1geo_type,
	actor1geo_fullname,
	actor1geo_countrycode,
	actor1geo_adm1code,
	actor1geo_lat,
	actor1geo_long,
	actor1geo_featureid,
	actor2geo_type,
	actor2geo_fullname,
	actor2geo_countrycode,
	actor2geo_adm1code,
	actor2geo_lat,
	actor2geo_long,
	actor2geo_featureid,
	actiongeo_type,
	actiongeo_fullname,
	actiongeo_countrycode,
	actiongeo_adm1code,
	actiongeo_lat,
	actiongeo_long,
	actiongeo_featureid,
	dateadded
FROM hai_table
```

print columns

```sql
SELECT *
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'data_table'

```

useful vim command to insert comman to end of each column line name

```bash
:%/s/$/,/g
```

## Quicksight with Athena

first need to ensure that quicksight allowed to access data in s3 and athena

- quicksight login https://us-east-1.quicksight.aws.amazon.com/
- goto manage quicksight
- goto security and permission
- create a new dataset with athena
- can select direct query
- now do the analysis and visualization

## Troubleshooting

- data with null value
- delimeter comman or tab
- format such as parquet, csv

```
globaleventid
sqldate
monthyear
yearn
fractiondate
actor1code
actor1name
actor1countrycode
actor1knowngroupcode
actor1ethniccode
actor1religion1code
actor1religion2code
actor1type1code
actor1type2code
actor1type3code
actor2code
actor2name
actor2countrycode
actor2knowngroupcode
actor2ethniccode
actor2religion1code
actor2religion2code
actor2type1code
actor2type2code
actor2type3code
isrootevent
eventcode
eventbasecode
eventrootcode
quadclass
goldsteinscale
nummentions
numsources
numarticles
avgtone
actor1geo_type
actor1geo_fullname
actor1geo_countrycode
actor1geo_adm1code
actor1geo_lat
actor1geo_long
actor1geo_featureid
actor2geo_type
actor2geo_fullname
actor2geo_countrycode
actor2geo_adm1code
actor2geo_lat
actor2geo_long
actor2geo_featureid
actiongeo_type
actiongeo_fullname
actiongeo_countrycode
actiongeo_adm1code
actiongeo_lat
actiongeo_long
actiongeo_featureid
dateadded
```

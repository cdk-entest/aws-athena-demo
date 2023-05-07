---
title: getting started with athena
description: getting started with athena
author: haimtran
publishedDate: 03/05/2022
date: 2022-03-05
---

## Introduction

[GitHub] this note shows

- Create Athena workgroup for query
- Create PySpark workgroup for interactive Spark
- Create table by Glue Crawler then query with Athena
- Create an external table from Athena editor

It is noted that

- Data catalog is created by glue and seen by athena
- Query engine are athena or spark, but spark only avaiable in some regions
- Have to terminate Spark sessions before deleting workgroups
- Queries can be saved and load
- Notebook and be exported and imported

## Athena WorkGroup

Enum to select Athena query or PySpark

```ts
export enum AthenaAnalyticEngine {
  PySpark = "PySpark engine version 3",
  Athena = "Athena engine version 3",
}
```

Create an Athena workgroup for SQL query

```ts
const workgroup = new CfnWorkGroup(this, "WorkGroupDemo", {
  name: "WorkGroupDemo",
  description: "demo",
  // destroy stack can delete workgroup event not empy
  recursiveDeleteOption: true,
  state: "ENABLED",
  workGroupConfiguration: {
    bytesScannedCutoffPerQuery: 107374182400,
    engineVersion: {
      // pyspark not support in cloudformation
      // available in some regions at this moment
      selectedEngineVersion: AthenaAnalyticEngine.Athena,
    },
    requesterPaysEnabled: true,
    publishCloudWatchMetricsEnabled: true,
    resultConfiguration: {
      // encryption default
      outputLocation: `s3://${props.destS3BucketName}/`,
    },
  },
});
```

Create an Athena workgroup with PySpark

```ts
const sparkWorkGroup = new CfnWorkGroup(this, "SparkWorkGroup", {
  name: sparkWorkGroupName,
  description: "spark",
  recursiveDeleteOption: true,
  state: "ENABLED",
  workGroupConfiguration: {
    executionRole: role.roleArn,
    bytesScannedCutoffPerQuery: 107374182400,
    engineVersion: {
      // effectiveEngineVersion: "",
      selectedEngineVersion: AthenaAnalyticEngine.PySpark,
    },
    requesterPaysEnabled: true,
    publishCloudWatchMetricsEnabled: false,
    resultConfiguration: {
      outputLocation: `s3://${props.destS3BucketName}/`,
    },
  },
});
```

## Create Table - Parquet Data

- Example 1: amazon-reviews-pds dataset (parquet with partitions)

Use the s3://amazon-reviews-pds/parquet to create a table and then query

```sql
create external table mytable (
 marketplace string,
 customer_id string,
 review_id string,
 product_id string,
 product_parent string,
 product_title string,
 star_rating int,
 helpful_votes int,
 total_votes int,
 vine string,
 verified_purchase string,
 review_headline string,
 review_body string,
 review_date string,
 `year` int)
partitioned by (product_category string)
row format serde 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
stored as inputformat 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
outputformat 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
location "s3://amazon-reviews-pds/parquet/"
tblproperties ("classification"="parquet")
```

We might need to update partitions by using MSCK

```sql
msck repair table mytable;
```

Or use the ALTER sql

```sql
ALTER TABLE mytable SET LOCATION 's3://amazon-reviews-pds/parquet/product_category=Gift_Card/';
```

Finally query the new created table

```sql
select marketplace, customer_id, review_id, star_rating, review_body from mytable limit 10;
```

## Create Table - CSV Data

Sample data (delimeter is tab \t) or so-called TSV

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

- Example 1: amazon-review-pds/parquet
- Example 2: amazon-review-pds/tsv

It is quite straightfoward to create table using Glue Crawler

- Create an IAM role for Glue Crawler
- Create a Glue Crawler and specify the data source in S3
- After the crawler complete, you can query the table from Athena

## Create Table Using CTAS

- CTAS means CREATE TABLE AS SELECT
- Create a new table, parquet format from result of a query

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

## Troubleshooting

Check s3 data size

```bash
aws s3 ls --summarize --human-readable --recursive s3://amazon-reviews-pds/parquet/
aws s3 ls --summarize --human-readable --recursive s3://gdelt-open-data/events/
```

slow query in athena

```sql
select globaleventid, sum(fractiondate), yearn from data_table group by (globaleventid, yearn)
```

compare tsv.gz with parquet (columnar base), compare size, and query performance

```bash
aws s3 cp s3://amazon-reviews-pds/tsv/amazon_reviews_us_Watches_v1_00.tsv.gz
```

query

```sql
select marketplace,
	sum(total_votes) as sumvotes,
	product_title
from amazon_review_parquet
group by marketplace,
	product_title
order by sumvotes desc;
```

## Reference

- [Athena Data Limit](https://docs.aws.amazon.com/athena/latest/ug/workgroups-setting-control-limits-cloudwatch.html)

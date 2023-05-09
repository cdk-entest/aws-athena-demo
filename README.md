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
create external table amazon_reviews_parquet_table (
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

As the amazon-reviews-pds tsv prefix container some noisy files such as index.txt, you need to exclude it while creating a new table in Athena. I work around this by copy tsv.gz data to my own S3 bucket first.

```bash
aws s3 cp s3://amazon-reviews-pds/tsv/ s3://my-bucket/tsv/ --exclude '*' --include '*.tsv.gz' --recursive
```

Use the same amazon-reviews-pds but source the tsv data.

```sql
create external table tsv (
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
 ROW FORMAT DELIMITED
 FIELDS TERMINATED BY '\t'
 ESCAPED BY '\\'
 LINES TERMINATED BY '\n'
 stored as inputformat 'org.apache.hadoop.mapred.TextInputFormat'
 outputformat 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
 location "s3://my-bucket/tsv/"
 tblproperties ("classification"="csv", "skip.header.line.count"="1")
```

Or specifing serde and SERDEPROPERTIES as below

```sql
create external table tsvtest (
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
row format serde 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
WITH SERDEPROPERTIES(
    'field.delim' = '\t',
    'escape.delim' = '\\',
    'line.delim' = '\n'
)
stored as inputformat 'org.apache.hadoop.mapred.TextInputFormat'
outputformat 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
location "s3://athena-query-result-haimtran-us-east-1-08052023/tsv/"
tblproperties ("classification"="csv", "skip.header.line.count"="1")
```

You might need to update partition and metadata using MSCK

```sql
msck repair table mytable;
```

## Parquet versus TSV

Create the same query with two tables to see performance and cost. First, for the tsv table

```sql
select customer_id, sum(star_rating) as sum_rating
from amazon_reviews_tsv
group by customer_id
order by sum_rating desc;
```

and for parquet table

```sql
select customer_id, sum(star_rating) as sum_rating
from amazon_reviews_parquet
group by customer_id
order by sum_rating desc;
```

- tsv: scanned 32.22 GB and runtime 97 seconds
- parquet: scanned 1.21 GB and runtime 38 seconds
- check time in queue

## Create Table from Glue Crawler

- Example 1: amazon-review-pds/parquet
- Example 2: amazon-review-pds/tsv

It is quite straightfoward to create table using Glue Crawler

- Create an IAM role for Glue Crawler
- Create a Glue Crawler and specify the data source in S3
- After the crawler complete, you can query the table from Athena

## Create Table Using CTAS

- CTAS means CREATE TABLE AS SELECT
- Create a new table, parquet format from result of a query, same location
- Create a new table, parquet format from result of a query, external location

First, create a new table in the same location bucket. The partition key should placed at the last.

```sql
CREATE TABLE IF NOT EXISTS ctas_parquet_same_location(
    format='parquet',
    partitioned_by = ARRAY['marketplace']
) AS
SELECT customer_id, product_id, star_rating, marketplace from amazon_reviews_tsv;
```

Second, create the new table in an external location

```sql
CREATE TABLE IF NOT EXISTS ctas WITH (
	format = 'PARQUET',
	external_location = 's3://athena-query-result-entest/new-data-parquet/'
) AS
SELECT customer_id, product_id, star_rating FROM parquet
```

print columns

```sql
SELECT *
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'data_table'
```

## Troubleshooting

- check s3 bucket size
- data with null value
- delimeter comman or tab
- format such as parquet, csv

some slow queries

```sql
select customer_id, product_id, sum(star_rating) as sum_rating from parquet
group by customer_id, product_id
order by sum_rating desc;
```

Check s3 data size

```bash
aws s3 ls --summarize --human-readable --recursive s3://amazon-reviews-pds/parquet/
aws s3 ls --summarize --human-readable --recursive s3://gdelt-open-data/events/
```

Useful vim command to insert comma to end of each column line name

```bash
:%/s/$/,/g
```

## Reference

- [Athena Data Limit](https://docs.aws.amazon.com/athena/latest/ug/workgroups-setting-control-limits-cloudwatch.html)

- [Athena Create Table Paritions](https://repost.aws/knowledge-center/athena-create-use-partitioned-tables)

- [Amazon Reviews Dataset](https://s3.amazonaws.com/amazon-reviews-pds/readme.html)

- [Athena shorcuts](https://aws.amazon.com/blogs/big-data/improve-productivity-by-using-keyboard-shortcuts-in-amazon-athena-query-editor/)

- [Athena SerDe](https://docs.aws.amazon.com/athena/latest/ug/lazy-simple-serde.html)

- [DDL Statement](https://docs.aws.amazon.com/athena/latest/ug/ddl-reference.html)

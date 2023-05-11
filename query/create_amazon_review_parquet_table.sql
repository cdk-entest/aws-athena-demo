create external table amazon_reviews_parquet(
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
-- msck repair table amazon_reviews_parquet; 

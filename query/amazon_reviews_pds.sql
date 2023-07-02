-- create external table from parquet data 
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
	review_date date,
	`year` int
)
partitioned by (product_category string)
row format serde 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
stored as inputformat 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat' outputformat 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
location "s3://amazon-reviews-pds/parquet/"
tblproperties ("classification" = "parquet");

-- msck repair table amazon_reviews_parquet
msck repair table amazon_reviews_parquet_table;

-- create external table from tsv data
create external table amazon_reviews_tsv_table (
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
	`year` int
)
row format delimited fields terminated by '\t' escaped by '\\' lines terminated by '\n'
stored as inputformat 'org.apache.hadoop.mapred.TextInputFormat' outputformat 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
location "s3://amazon-reviews-pds/tsv/"
tblproperties (
	"classification" = "csv",
	"skip.header.line.count" = "1"
);

-- create table and convert from csv to parquet 
create table if not exists ctas_table with (format = 'parquet') as
select "marketplace",
	"customer_id",
	"review_id",
	"product_id",
	"product_title",
	"star_rating"
from "amazon_reviews_tsv_table";

-- ctas create table in the athena result bucket with partitioned
create table if not exists ctas_table_partitioned with (
	format = 'parquet',
	partitioned_by = array [ 'marketplace' ]
) as
select "customer_id",
	"review_id",
	"product_id",
	"product_title",
	"star_rating",
	"marketplace"
from "amazon_reviews_tsv_table";

-- show columsn and scheuma of a table 
select *
from information_schema.columns
where table_name = 'amazon_reviews_parquet_table';

-- count row 
select count(*) as num_row
from "amazon_reviews_parquet_table";

-- group by 
select "customer_id",
	sum("star_rating") as sum_rating
from "amazon_reviews_parquet_table"
group by "customer_id"
order by sum_rating desc;

-- insert values 
insert into "ctas_table"
values(
		'VN',
		'12345678',
		'12345678',
		'12345678',
		'TCB',
		5
	);
	
-- check output of insert 
select "marketplace",
	"customer_id"
from "ctas_table"
where marketplace = 'VN';
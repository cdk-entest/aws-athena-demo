-- ctas create table in the athena result bucket
create table if not exists ctas_table with (format = 'parquet') as
select "marketplace",
	"customer_id",
	"review_id",
	"product_id",
	"product_title",
	"star_rating"
from "amazon_reviews_tsv_table"

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
from "amazon_reviews_tsv_table"

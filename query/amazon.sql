select marketplace,
	sum(total_votes) as sumvotes,
	product_title
from amazon_review_glue_test_05032023parquet
group by marketplace,
	product_title
order by sumvotes desc;
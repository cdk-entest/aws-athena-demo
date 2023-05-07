select marketplace,
	sum(total_votes) as sumvotes,
	product_title
from amazon_reviews_tsv 
group by marketplace,
	product_title
order by sumvotes desc;
create table ctas with (
    format='parquet',
    partitioned_by = ARRAY['marketplace']
) as 
select customer_id, product_id, star_rating, marketplace from amazon_reviews_tsv; 

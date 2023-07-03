-- create sport_event table 
CREATE EXTERNAL TABLE sporting_event(
	op string,
	cdc_timestamp timestamp,
	id bigint,
	sport_type_name string,
	home_team_id int,
	away_team_id int,
	location_id smallint,
	start_date_time timestamp,
	start_date date,
	sold_out smallint
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS INPUTFORMAT 'org.apache.hadoop.mapred.TextInputFormat' OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://amazon-reviews-pds-040720231/sporting-event-full/';

-- create sport_event_cdc table 
CREATE EXTERNAL TABLE sporting_event_cdc(
	op string,
	cdc_timestamp timestamp,
	id bigint,
	sport_type_name string,
	home_team_id int,
	away_team_id int,
	location_id smallint,
	start_date_time timestamp,
	start_date date,
	sold_out smallint
)
PARTITIONED BY (partition_date string)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS INPUTFORMAT 'org.apache.hadoop.mapred.TextInputFormat' OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://amazon-reviews-pds-040720231/sporting-event-cdc/';

-- update the partition 
ALTER TABLE sporting_event_cdc
ADD PARTITION (partition_date = '2022-09-22')
	location 's3://amazon-reviews-pds-040720231/sporting-event-cdc/2022/09/22/'


-- create sport_event_iceberg table 
CREATE TABLE sporting_event_iceberg WITH (
	table_type = 'ICEBERG',
	location = 's3://amazon-reviews-pds-040720231/curated/sporting-event',
	format = 'PARQUET',
	is_external = false
) AS
SELECT id,
	sport_type_name,
	home_team_id,
	away_team_id,
	cast(location_id as int) as location_id,
	cast(start_date_time as timestamp(6)) as start_date_time,
	start_date,
	cast(sold_out as int) as sold_out
FROM sporting_event;

-- merge the cdc into the iceberge table 
MERGE INTO sporting_event_iceberg t USING (
	SELECT op,
		cdc_timestamp,
		id,
		sport_type_name,
		home_team_id,
		away_team_id,
		location_id,
		start_date_time,
		start_date,
		sold_out
	FROM sporting_event_cdc
	WHERE partition_date = '2022-09-22'
) s ON t.id = s.id
WHEN MATCHED
AND s.op = 'D' THEN DELETE
WHEN MATCHED THEN
UPDATE
SET sport_type_name = s.sport_type_name,
	home_team_id = s.home_team_id,
	location_id = s.location_id,
	start_date_time = s.start_date_time,
	start_date = s.start_date,
	sold_out = s.sold_out
	WHEN NOT MATCHED THEN
INSERT (
		id,
		sport_type_name,
		home_team_id,
		away_team_id,
		location_id,
		start_date_time,
		start_date
	)
VALUES (
		s.id,
		s.sport_type_name,
		s.home_team_id,
		s.away_team_id,
		s.location_id,
		s.start_date_time,
		s.start_date
	)

-- check output 
SELECT *
FROM sporting_event_iceberg
WHERE id in (1, 5, 11, 21);

-- create historical view 
CREATE VIEW v_sporting_event_previous_snapshot AS
SELECT id,
	sport_type_name,
	home_team_id,
	away_team_id,
	location_id,
	cast(start_date_time as timestamp(3)) as start_date_time,
	start_date,
	sold_out
FROM sporting_event_iceberg FOR TIMESTAMP AS OF current_timestamp + interval '-10' minute;

-- check the id 21 preivously 
SELECT *
FROM v_sporting_event_previous_snapshot
WHERE id = 21;
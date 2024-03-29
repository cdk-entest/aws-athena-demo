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
LOCATION 's3://gdelt-open-data/events/'
TBLPROPERTIES ('classification' = 'csv');
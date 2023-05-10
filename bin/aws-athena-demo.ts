#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsAthenaDemoStack } from "../lib/aws-athena-demo-stack";
import { config } from "../config";
import { DataScientistStack } from "../lib/data-scientist-stack";

const app = new cdk.App();

// create athena workgroup
new AwsAthenaDemoStack(app, "AwsAthenaDemoStack", {
  destS3BucketName: config.destS3BucketName,
  sourceS3BucketName: config.sourceS3BucketName,
  athenaWorkgroupName: "QueryWorkGroup",
  sparkWorkgroupName: "SparkWorkGroup",
  env: {
    region: process.env.CDK_REGION_DEFAULT,
    account: process.env.CDK_ACCOUNT_DEFAULT,
  },
});

// create a IAM user for data scientist
new DataScientistStack(app, "DataScientistStack", {
  userName: "data-scientist",
  athenaResultBucketArn: `arn:aws:s3:::${config.destS3BucketName}`,
  athenaWorkgroupName: "QueryWorkGroup",
  sourceBucketArn: `arn:aws:s3:::${config.sourceS3BucketName}`,
  databaseName: "default",
  databasePermissions: [],
});

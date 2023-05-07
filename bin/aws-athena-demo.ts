#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsAthenaDemoStack } from "../lib/aws-athena-demo-stack";
import { config } from "../config";

const app = new cdk.App();
new AwsAthenaDemoStack(app, "AwsAthenaDemoStack", {
  destS3BucketName: config.destS3BucketName,
  sourceS3BucketName: config.sourceS3BucketName,
  env: {
    region: process.env.CDK_REGION_DEFAULT,
    account: process.env.CDK_ACCOUNT_DEFAULT,
  },
});

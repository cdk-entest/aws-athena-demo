#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsAthenaDemoStack } from "../lib/aws-athena-demo-stack";

const app = new cdk.App();
new AwsAthenaDemoStack(app, "AwsAthenaDemoStack", {
  // where to store query result
  bucketName: "athena-query-result-us-east-1-88",
  env: {
    region: "us-east-1",
    account: process.env.CDK_ACCOUNT_DEFAULT,
  },
});

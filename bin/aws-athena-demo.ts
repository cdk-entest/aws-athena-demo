#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsAthenaDemoStack } from "../lib/aws-athena-demo-stack";
import { config } from "../config";

const app = new cdk.App();
new AwsAthenaDemoStack(app, "AwsAthenaDemoStack", {
  s3: config.s3,
  env: {
    region: "us-east-1",
    account: process.env.CDK_ACCOUNT_DEFAULT,
  },
});

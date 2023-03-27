import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import { CfnNamedQuery, CfnWorkGroup } from "aws-cdk-lib/aws-athena";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

interface AthenaProps extends StackProps {
  bucketName: string;
}

export class AwsAthenaDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AthenaProps) {
    super(scope, id, props);

    // create s3 query result
    const bucket = new cdk.aws_s3.Bucket(this, "AthenaQueryResultBucket", {
      bucketName: props.bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // create workgroup
    const workgroup = new CfnWorkGroup(this, "WorkGroupDemo", {
      name: "WorkGroupDemo",
      description: "demo",
      // destroy stack can delete workgroup event not empy
      recursiveDeleteOption: false,
      state: "ENABLED",
      workGroupConfiguration: {
        bytesScannedCutoffPerQuery: 107374182400,
        engineVersion: {
          // pyspark not support in cloudformation
          // available in some regions at this moment
          selectedEngineVersion: "AUTO",
        },
        requesterPaysEnabled: true,
        publishCloudWatchMetricsEnabled: true,
        resultConfiguration: {
          // encryption default
          outputLocation: `s3://${bucket.bucketName}/athena-query-result/`,
        },
      },
    });

    // saved queries
    new CfnNamedQuery(this, "CreateGdeltTable", {
      name: "CreateGdeltTable",
      database: "default",
      workGroup: workgroup.ref,
      queryString: fs.readFileSync(
        path.join(__dirname, "./../query/gdelt.sql"),
        {
          encoding: "utf-8",
        }
      ),
    });

    // save example query
    new CfnNamedQuery(this, "QueryAmazonReview", {
      name: "QueryAmazonReview",
      database: "default",
      workGroup: workgroup.ref,
      queryString: fs.readFileSync(
        path.join(__dirname, "./../query/amazon.sql"),
        {
          encoding: "utf-8",
        }
      ),
    });

    // save query
    new CfnNamedQuery(this, "CreateAmazonReviewTable", {
      name: "CreateAmazonReviewtable",
      database: "default",
      workGroup: workgroup.ref,
      queryString: fs.readFileSync(
        path.join(__dirname, "./../query/amazon_review.sql"),
        {
          encoding: "utf-8",
        }
      ),
    });
  }
}

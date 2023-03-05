import * as cdk from "aws-cdk-lib";
import { StackProps } from "aws-cdk-lib";
import { CfnNamedQuery, CfnWorkGroup } from "aws-cdk-lib/aws-athena";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

interface AthenaProps extends StackProps {
  s3: string;
}

export class AwsAthenaDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AthenaProps) {
    super(scope, id, props);

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
          outputLocation: props.s3,
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
  }
}

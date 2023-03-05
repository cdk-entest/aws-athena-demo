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
      recursiveDeleteOption: false,
      state: "ENABLED",
      workGroupConfiguration: {
        bytesScannedCutoffPerQuery: 1073741824,
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
    new CfnNamedQuery(this, "SaveQueries", {
      name: "SaveQueries",
      database: "default",
      workGroup: workgroup.ref,
      queryString: fs.readFileSync(
        path.join(__dirname, "./../query/test.sql"),
        {
          encoding: "utf-8",
        }
      ),
    });
  }
}

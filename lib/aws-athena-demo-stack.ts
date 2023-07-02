import { Stack } from "aws-cdk-lib";
import { aws_iam, aws_s3 } from "aws-cdk-lib";
import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import { CfnNamedQuery, CfnWorkGroup } from "aws-cdk-lib/aws-athena";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

interface AthenaProps extends StackProps {
  destS3BucketName: string;
  sourceS3BucketName: string;
  athenaWorkgroupName: string;
  sparkWorkgroupName: string;
}

export enum AthenaAnalyticEngine {
  PySpark = "PySpark engine version 3",
  Athena = "Athena engine version 3",
}

export class AwsAthenaDemoStack extends Stack {
  constructor(scope: Construct, id: string, props: AthenaProps) {
    super(scope, id, props);

    // create s3 query result
    const bucket = new aws_s3.Bucket(this, "AthenaQueryResultBucket", {
      bucketName: props.destS3BucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // execution role for athena spark (for notebook)
    const role = new aws_iam.Role(this, "AthenaExecutionRoleDemo", {
      roleName: "AthenaExecutionRoleDemo",
      assumedBy: new aws_iam.ServicePrincipal("athena.amazonaws.com"),
    });

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:s3:::${props.destS3BucketName}/*`,
          `arn:aws:s3:::${props.sourceS3BucketName}/*`,
          `arn:aws:s3:::${props.destS3BucketName}`,
          `arn:aws:s3:::${props.sourceS3BucketName}`,
        ],
        actions: [
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject",
          "s3:GetObject",
        ],
      })
    );

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:athena:${this.region}:${this.account}:workgroup/${props.sparkWorkgroupName}`,
        ],
        actions: [
          "athena:GetWorkGroup",
          "athena:TerminateSession",
          "athena:GetSession",
          "athena:GetSessionStatus",
          "athena:ListSessions",
          "athena:StartCalculationExecution",
          "athena:GetCalculationExecutionCode",
          "athena:StopCalculationExecution",
          "athena:ListCalculationExecutions",
          "athena:GetCalculationExecution",
          "athena:GetCalculationExecutionStatus",
          "athena:ListExecutors",
          "athena:ExportNotebook",
          "athena:UpdateNotebook",
        ],
      })
    );

    // create athena sql workgroup
    const workgroup = new CfnWorkGroup(this, "WorkGroupDemo", {
      name: props.athenaWorkgroupName,
      description: "demo",
      // destroy stack can delete workgroup event not empy
      recursiveDeleteOption: true,
      state: "ENABLED",
      workGroupConfiguration: {
        bytesScannedCutoffPerQuery: 107374182400,
        engineVersion: {
          // pyspark not support in cloudformation
          // available in some regions at this moment
          selectedEngineVersion: AthenaAnalyticEngine.Athena,
        },
        requesterPaysEnabled: true,
        publishCloudWatchMetricsEnabled: true,
        resultConfiguration: {
          // encryption default
          outputLocation: `s3://${props.destS3BucketName}/`,
        },
      },
    });

    // create apache spark workgroup
    const sparkWorkGroup = new CfnWorkGroup(this, "SparkWorkGroup", {
      name: props.sparkWorkgroupName,
      description: "spark",
      recursiveDeleteOption: true,
      state: "ENABLED",
      workGroupConfiguration: {
        executionRole: role.roleArn,
        bytesScannedCutoffPerQuery: 107374182400,
        engineVersion: {
          // effectiveEngineVersion: "",
          selectedEngineVersion: AthenaAnalyticEngine.PySpark,
        },
        requesterPaysEnabled: true,
        publishCloudWatchMetricsEnabled: false,
        resultConfiguration: {
          outputLocation: `s3://${props.destS3BucketName}/`,
        },
      },
    });

    // query on gdelt dataset  
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

    // query on amazon-reviews-pds dataset  
    new CfnNamedQuery(this, "AmazonReviewParquetTable", {
      name: "CreateAmazonReviewParquettable",
      database: "default",
      workGroup: workgroup.ref,
      queryString: fs.readFileSync(
        path.join(
          __dirname,
          "./../query/amazon_reviews_pds.sql"
        ),
        {
          encoding: "utf-8",
        }
      ),
    });
  }
}

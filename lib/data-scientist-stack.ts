import { aws_iam, aws_secretsmanager, Stack, StackProps } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface DataScientistProps extends StackProps {
  userName: string;
  athenaResultBucketArn: string;
  sourceBucketArn: string;
  databaseName: string;
  databasePermissions: string[];
}

export class DataScientistStack extends Stack {
  public userArn: string;

  constructor(scope: Construct, id: string, props: DataScientistProps) {
    super(scope, id, props);

    const secret = new aws_secretsmanager.Secret(
      this,
      `${props.userName}Secret`,
      {
        secretName: `${props.userName}Secret`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ userName: props.userName }),
          generateStringKey: "password",
        },
      }
    );

    const user = new aws_iam.User(this, `${props.userName}IAMUSER`, {
      userName: props.userName,
      password: secret.secretValueFromJson("password"),
      passwordResetRequired: false,
    });

    // access to all tables in Glue catalog
    user.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAthenaFullAccess")
    );

    // access to all underlying data in S3
    user.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:*"],
        resources: [
          props.athenaResultBucketArn,
          `${props.athenaResultBucketArn}/*`,
          props.sourceBucketArn,
          `${props.sourceBucketArn}/*`,
        ],
      })
    );

    // least priviledge access for demo
    const policy = new aws_iam.Policy(
      this,
      "LeastPriviledgePolicyForDataScientist",
      {
        policyName: "LeastPriviledgePolicyForDataScientist",
        statements: [
          // athena
          new aws_iam.PolicyStatement({
            actions: ["athena:*"],
            effect: Effect.ALLOW,
            resources: ["*"],
          }),
          // access s3
          new aws_iam.PolicyStatement({
            actions: [
              "s3:GetBucketLocation",
              "s3:GetObject",
              "s3:ListBucket",
              "s3:ListBucketMultipartUploads",
              "s3:ListMultipartUploadParts",
              "s3:AbortMultipartUpload",
              "s3:CreateBucket",
              "s3:PutObject",
              "s3:PutBucketPublicAccessBlock",
            ],
            effect: Effect.ALLOW,
            resources: [
              props.athenaResultBucketArn,
              `${props.athenaResultBucketArn}/*`,
              props.sourceBucketArn,
              `${props.sourceBucketArn}/*`,
            ],
          }),
          // access glue catalog
          new aws_iam.PolicyStatement({
            actions: [
              "glue:CreateDatabase",
              "glue:DeleteDatabase",
              "glue:GetDatabase",
              "glue:GetDatabases",
              "glue:UpdateDatabase",
              "glue:CreateTable",
              "glue:DeleteTable",
              "glue:BatchDeleteTable",
              "glue:UpdateTable",
              "glue:GetTable",
              "glue:GetTables",
              "glue:BatchCreatePartition",
              "glue:CreatePartition",
              "glue:DeletePartition",
              "glue:BatchDeletePartition",
              "glue:UpdatePartition",
              "glue:GetPartition",
              "glue:GetPartitions",
              "glue:BatchGetPartition",
            ],
            effect: Effect.ALLOW,
            resources: [
              `arn:aws:glue:${this.region}:*:table/${props.databaseName}/*`,
              `arn:aws:glue:${this.region}:*:database/${props.databaseName}*`,
              `arn:aws:glue:${this.region}:*:*catalog`,
            ],
          }),
          // access lakeformation
          // new aws_iam.PolicyStatement({
          //   actions: ["lakeformation:GetDataAccess"],
          //   effect: Effect.ALLOW,
          //   resources: ["*"],
          // }),
        ],
      }
    );

    policy.attachToUser(user);
  }
}

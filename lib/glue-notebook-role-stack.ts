import { Stack, StackProps, aws_iam } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface GlueNotebookRoleProps extends StackProps {
  sourceBucketArn: string;
  athenaResultBucketArn: string;
  databaseName: string;
}

export class GlueNotebookRoleStack extends Stack {
  constructor(scope: Construct, id: string, props: GlueNotebookRoleProps) {
    super(scope, id, props);

    // glue role
    const role = new aws_iam.Role(this, "RoleForGlueNotebook", {
      roleName: "RoleForGlueNotebook",
      assumedBy: new aws_iam.ServicePrincipal("glue.amazonaws.com"),
    });

    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSGlueServiceRole"
      )
    );

    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "CloudWatchAgentServerPolicy"
      )
    );

    //
    const policy = new aws_iam.Policy(
      this,
      "LeastPriviledgePolicyForGlueNotebookRole",
      {
        policyName: "LeastPriviledgePolicyForGlueNotebookRole",
        statements: [
          // pass iam role
          new aws_iam.PolicyStatement({
            actions: ["iam:PassRole", "iam:GetRole"],
            effect: Effect.ALLOW,
            resources: ["*"],
          }),
          // athena
          new aws_iam.PolicyStatement({
            actions: ["athena:*"],
            effect: Effect.ALLOW,
            resources: ["*"],
          }),
          // access s3
          new aws_iam.PolicyStatement({
            actions: ["s3:*"],
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
            actions: ["glue:*"],
            effect: Effect.ALLOW,
            resources: [
              `arn:aws:glue:${this.region}:*:table/${props.databaseName}/*`,
              `arn:aws:glue:${this.region}:*:database/${props.databaseName}*`,
              `arn:aws:glue:${this.region}:*:*catalog`,
            ],
          }),
        ],
      }
    );

    policy.attachToRole(role);
  }
}

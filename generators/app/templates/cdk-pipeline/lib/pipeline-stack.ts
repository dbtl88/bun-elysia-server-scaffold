import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import {
  SecretValue,
  aws_codepipeline,
  aws_codepipeline_actions,
} from "aws-cdk-lib";
import { CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import {
  ComputeType,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { PipelineType } from "aws-cdk-lib/aws-codepipeline";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export interface PipelineStackProps extends cdk.StackProps {
  repo: string;
  branch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    name: string,
    props: PipelineStackProps
  ) {
    super(scope, id, props);

    const bucket = new Bucket(this, `${name}-DeployBucket`, {
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const fullSource = new aws_codepipeline.Artifact();
    const serverArtifact = new aws_codepipeline.Artifact("server");

    const sourceAction = new aws_codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: "<%=githubUser%>",
      repo: props.repo,
      oauthToken: SecretValue.secretsManager("github-token", {
        jsonField: "token",
      }),
      output: fullSource,
      branch: props.branch,
    });

    const buildProject = new PipelineProject(this, `${name}-Build`, {
      environment: {
        buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
        computeType: ComputeType.SMALL,
      },
    });

    const buildPolicy = new PolicyStatement({
      resources: ["*"],
      actions: ["ecr:*"],
    });
    buildProject.addToRolePolicy(buildPolicy);

    const buildAction = new CodeBuildAction({
      actionName: "serverBuildAction",
      input: fullSource,
      project: buildProject,
      outputs: [serverArtifact],
    });

    new aws_codepipeline.Pipeline(this, `${name}-Pipeline`, {
      pipelineName: `${name}-pipeline`,
      pipelineType: PipelineType.V2,
      stages: [
        {
          stageName: "github",
          actions: [sourceAction],
        },
        {
          stageName: "build-push-to-ECR",
          actions: [buildAction],
        },
      ],
      artifactBucket: bucket,
    });
  }
}

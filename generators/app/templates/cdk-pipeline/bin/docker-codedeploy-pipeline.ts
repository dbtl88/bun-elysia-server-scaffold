#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";

const name = "<%=projectName%>-server";
const app = new cdk.App();
new PipelineStack(app, `${name}-pipeline-stack`, name, {
  repo: "<%=appRepo%>",
  branch: "main",
});

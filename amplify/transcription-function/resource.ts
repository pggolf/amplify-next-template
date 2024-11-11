import { defineFunction } from "@aws-amplify/backend";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";

export const transcriptionFunction = defineFunction({
  name: "transcription-function",
  entry: "./handler.ts",
  permissions: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "transcribe:StartTranscriptionJob"
      ],
      resources: ["*"] // Consider restricting this to specific bucket ARNs
    })
  ],
  environment: {
    OUTPUT_BUCKET_NAME: "amplify-d4cvka10q2rxe-mai-pgwednightbucketb3376e67-xlgwpt6rlgff" // Store this as an environment variable
  }
});
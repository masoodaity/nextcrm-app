import { S3 } from "@aws-sdk/client-s3";

let cachedS3Client: S3 | null = null;

export function getS3Client(): S3 {
  if (cachedS3Client) return cachedS3Client;

  const { DO_ENDPOINT, DO_REGION, DO_ACCESS_KEY_ID, DO_ACCESS_KEY_SECRET } =
    process.env;

  if (!DO_ENDPOINT) {
    throw new Error("DO_ENDPOINT is not defined");
  }
  if (!DO_REGION) {
    throw new Error("DO_REGION is not defined");
  }
  if (!DO_ACCESS_KEY_ID) {
    throw new Error("DO_ACCESS_KEY_ID is not defined");
  }
  if (!DO_ACCESS_KEY_SECRET) {
    throw new Error("DO_ACCESS_KEY_SECRET is not defined");
  }

  cachedS3Client = new S3({
    endpoint: DO_ENDPOINT,
    region: DO_REGION,
    credentials: {
      accessKeyId: DO_ACCESS_KEY_ID,
      secretAccessKey: DO_ACCESS_KEY_SECRET,
    },
  });

  return cachedS3Client;
}

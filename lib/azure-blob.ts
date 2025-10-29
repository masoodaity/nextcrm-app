import { BlobServiceClient, ContainerClient, BlockBlobClient } from "@azure/storage-blob";

let cachedBlobServiceClient: BlobServiceClient | null = null;

export function getBlobServiceClient(): BlobServiceClient {
  if (cachedBlobServiceClient) return cachedBlobServiceClient;

  const { AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY } =
    process.env as Record<string, string | undefined>;

  if (AZURE_STORAGE_CONNECTION_STRING) {
    cachedBlobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    return cachedBlobServiceClient;
  }

  if (!AZURE_STORAGE_ACCOUNT) {
    throw new Error("AZURE_STORAGE_ACCOUNT is not defined");
  }
  if (!AZURE_STORAGE_KEY) {
    throw new Error("AZURE_STORAGE_KEY is not defined");
  }

  const sharedKeyCredential = new (require("@azure/storage-blob")).StorageSharedKeyCredential(
    AZURE_STORAGE_ACCOUNT,
    AZURE_STORAGE_KEY
  );

  cachedBlobServiceClient = new BlobServiceClient(
    `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
    sharedKeyCredential
  );

  return cachedBlobServiceClient;
}

export function getContainerClient(containerName?: string): ContainerClient {
  const container = containerName || process.env.AZURE_BLOB_CONTAINER;
  if (!container) {
    throw new Error("AZURE_BLOB_CONTAINER is not defined");
  }
  const service = getBlobServiceClient();
  return service.getContainerClient(container);
}

export function getBlockBlobClient(
  blobPath: string,
  containerName?: string
): BlockBlobClient {
  const containerClient = getContainerClient(containerName);
  return containerClient.getBlockBlobClient(blobPath);
}


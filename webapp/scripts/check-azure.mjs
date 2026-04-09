import fs from "node:fs/promises";
import path from "node:path";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

async function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  let contents = "";

  try {
    contents = await fs.readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  await loadEnvFile();

  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_KEY;
  const container = process.env.AZURE_STORAGE_CONTAINER;

  if (!account || !key || !container) {
    console.error(
      "Missing AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY, or AZURE_STORAGE_CONTAINER.",
    );
    process.exit(1);
  }

  const credential = new StorageSharedKeyCredential(account, key);
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential,
  );
  const containerClient = blobServiceClient.getContainerClient(container);

  try {
    const props = await containerClient.getProperties();
    console.log("✅ Connected to Azure Blob Storage.");
    console.log(`Container: ${container}`);
    console.log(
      `Last modified: ${props.lastModified?.toISOString() ?? "unknown"}`,
    );
  } catch (error) {
    console.error("❌ Failed to connect to Azure Blob Storage.");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

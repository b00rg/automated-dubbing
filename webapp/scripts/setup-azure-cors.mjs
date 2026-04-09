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
    console.log("Loaded context from .env file");
  } catch {
    console.log("No .env file found, using process.env");
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

  if (!account || !key) {
    console.error("Missing AZURE_STORAGE_ACCOUNT or AZURE_STORAGE_KEY.");
    process.exit(1);
  }

  const credential = new StorageSharedKeyCredential(account, key);
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential,
  );

  console.log("Setting service properties (CORS)...");

  try {
    const props = await blobServiceClient.getProperties();
    const existingCors = props.cors || [];

    const newCorsRule = {
      allowedOrigins: "*",
      allowedMethods: "GET,HEAD,OPTIONS",
      allowedHeaders: "*",
      exposedHeaders:
        "Content-Length,Content-Range,Accept-Ranges,Content-Encoding,Content-Type,ETag",
      maxAgeInSeconds: 86400,
    };

    // Check if a similar rule exists and update it, or add new
    let found = false;
    const updatedCors = existingCors.map((rule) => {
      if (rule.allowedOrigins === "*") {
        found = true;
        // Merge methods
        const methods = new Set([
          ...rule.allowedMethods.split(","),
          ...newCorsRule.allowedMethods.split(","),
        ]);
        const exposed = new Set([
          ...rule.exposedHeaders.split(","),
          ...newCorsRule.exposedHeaders.split(","),
        ]);

        return {
          ...rule,
          allowedMethods: Array.from(methods).join(","),
          exposedHeaders: Array.from(exposed).join(","),
          allowedHeaders: "*", // Enforce *
          maxAgeInSeconds: 86400,
        };
      }
      return rule;
    });

    if (!found) {
      updatedCors.push(newCorsRule);
    }

    const serviceProperties = {
      cors: updatedCors,
    };

    console.log(
      "Updating service properties with:",
      JSON.stringify(serviceProperties, null, 2),
    );
    await blobServiceClient.setProperties(serviceProperties);
    console.log("CORS rules updated successfully.");
  } catch (err) {
    console.error("Error setting CORS properties:", err.message);
    process.exit(1);
  }
}

main();

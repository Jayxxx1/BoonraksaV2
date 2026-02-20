import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../src/config/config.js";
import path from "path";
import fs from "fs";

/**
 * Upload Service for Nipa Cloud S3 (AWS S3 Compatible)
 *
 * This service provides a unified interface for file uploads.
 * - Development: Uses local disk storage (uploads/)
 * - Production: Uses Nipa Cloud S3 bucket
 *
 * Switching is automatic based on environment variables.
 */

// Determine if S3 is properly configured
const isS3Configured = () => {
  return (
    config.S3_ACCESS_KEY &&
    config.S3_SECRET_KEY &&
    config.S3_ENDPOINT &&
    !config.S3_ENDPOINT.includes("localhost") &&
    config.S3_BUCKET
  );
};

// S3 Client (lazy initialization)
let s3Client = null;

const getS3Client = () => {
  if (!s3Client && isS3Configured()) {
    s3Client = new S3Client({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for S3-compatible services like Nipa
    });
  }
  return s3Client;
};

/**
 * Generate a unique file key for S3 storage
 * @param {string} folderPath - The folder path (e.g., 'products', 'orders/123/mockups')
 * @param {string} originalName - Original filename
 * @returns {string} Unique file key
 */
const generateFileKey = (folderPath, originalName) => {
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folderPath}/${timestamp}-${safeName}`;
};

/**
 * Upload a file to storage (S3 or local disk)
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Original filename
 * @param {string} folderPath - Folder path for organization (e.g., 'products', 'orders/123')
 * @param {Object} options - Additional options
 * @param {string} options.contentType - MIME type of the file
 * @param {string} options.acl - ACL setting (default: 'public-read')
 * @returns {Promise<{url: string, key: string}>} Public URL and storage key
 */
export const uploadFile = async (
  fileBuffer,
  fileName,
  folderPath = "misc",
  options = {},
) => {
  const { contentType = "application/octet-stream", acl = "public-read" } =
    options;
  const fileKey = generateFileKey(folderPath, fileName);

  if (isS3Configured()) {
    // S3 Upload (Nipa Cloud)
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: acl,
    });

    await client.send(command);

    // Construct public URL
    const publicUrl = config.S3_PUBLIC_URL
      ? `${config.S3_PUBLIC_URL}/${fileKey}`
      : `${config.S3_ENDPOINT}/${config.S3_BUCKET}/${fileKey}`;

    console.log(`[UPLOAD-S3] File uploaded: ${fileKey}`);
    return { url: publicUrl, key: fileKey };
  } else {
    // Local Disk Upload (Development)
    const uploadDir = path.join("uploads", folderPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localPath = path.join(uploadDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(localPath, fileBuffer);

    // Normalize path for URL
    const relativePath = localPath.replace(/\\/g, "/");
    const localUrl = `http://localhost:${config.PORT || 8000}/${relativePath}`;

    console.log(`[UPLOAD-LOCAL] File saved: ${localPath}`);
    return { url: localUrl, key: relativePath };
  }
};

/**
 * Delete a file from storage
 * @param {string} fileKey - The file key/path to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteFile = async (fileKey) => {
  if (isS3Configured()) {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: fileKey,
    });

    await client.send(command);
    console.log(`[DELETE-S3] File deleted: ${fileKey}`);
    return true;
  } else {
    // Local file deletion
    const localPath = fileKey.startsWith("uploads/")
      ? fileKey
      : path.join("uploads", fileKey);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`[DELETE-LOCAL] File deleted: ${localPath}`);
      return true;
    }
    return false;
  }
};

/**
 * Get a signed URL for private file access (if needed)
 * @param {string} fileKey - The file key in S3
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (fileKey, expiresIn = 3600) => {
  if (!isS3Configured()) {
    // For local storage, just return the direct path
    return `http://localhost:${config.PORT || 8000}/${fileKey}`;
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: fileKey,
  });

  return await awsGetSignedUrl(client, command, { expiresIn });
};

/**
 * Storage Path Helpers
 * These functions generate consistent paths for different file types.
 */
export const storagePath = {
  product: (productId) => `products/${productId}`,
  orderMockup: (orderId) => `orders/${orderId}/mockups`,
  orderProduction: (orderId) => `orders/${orderId}/production`,
  orderPayment: (orderId) => `payments/${orderId}`,
  document: () => "documents",
  artwork: () => "artworks",
};

/**
 * Extract S3 key from a full public URL
 * @param {string} url - The URL to parse
 * @returns {string|null} The key or null if not an S3 URL
 */
export const extractKeyFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  // Handle S3 Public URL (configured) or Default S3 Endpoint
  const s3PublicUrl = config.S3_PUBLIC_URL;
  const s3Endpoint = config.S3_ENDPOINT;
  const bucket = config.S3_BUCKET;

  let key = null;

  if (s3PublicUrl && url.startsWith(s3PublicUrl)) {
    key = url.replace(s3PublicUrl, "");
  } else if (url.includes(`${s3Endpoint}/${bucket}/`)) {
    key = url.split(`${s3Endpoint}/${bucket}/`)[1];
  } else if (url.includes("amazonaws.com")) {
    // Fallback for standard AWS S3 URLs if encountered
    key = url.split(".com/")[1];
  }

  // Remove leading slash if any
  return key ? key.replace(/^\//, "") : null;
};

export default {
  uploadFile,
  deleteFile,
  getSignedUrl,
  storagePath,
  isS3Configured,
};

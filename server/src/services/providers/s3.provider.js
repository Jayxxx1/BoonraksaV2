import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService } from "./storage.service.js";
import config from "../config/config.js";

export class S3StorageProvider extends StorageService {
  constructor() {
    super();
    this.client = new S3Client({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for many S3-compatible providers like NIPA/MinIO
    });
    this.bucket = config.S3_BUCKET;
  }

  /**
   * Upload file to S3
   * @param {Object} file - Multer file object or stream
   * @param {string} folder - Destination folder
   */
  async uploadFile(file, folder = 'uploads') {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Metadata if needed
    });

    await this.client.send(command);

    return {
      key: key,
      url: config.S3_PUBLIC_URL 
        ? `${config.S3_PUBLIC_URL}/${key}` 
        : `${config.S3_ENDPOINT}/${this.bucket}/${key}`
    };
  }

  /**
   * Delete file from S3
   */
  async deleteFile(fileKey) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    return await this.client.send(command);
  }

  /**
   * Get temporary signed URL for private files
   */
  async getSignedUrl(fileKey, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }
}

// Singleton instance
export const storageService = new S3StorageProvider();
export default storageService;

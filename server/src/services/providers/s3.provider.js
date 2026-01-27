import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as presign } from '@aws-sdk/s3-request-presigner';

import StorageService from '../storage.service.js';
import config from '../../config/config.js';

export default class S3StorageProvider extends StorageService {
  constructor() {
    super();

    this.client = new S3Client({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    this.bucket = config.S3_BUCKET;
  }

  async uploadFile(file, folder = 'uploads') {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return {
      key,
      url: config.S3_PUBLIC_URL
        ? `${config.S3_PUBLIC_URL}/${key}`
        : `${config.S3_ENDPOINT}/${this.bucket}/${key}`,
    };
  }

  async deleteFile(fileKey) {
    return this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      })
    );
  }

  async getSignedUrl(fileKey, expiresIn = 3600) {
    return presign(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      }),
      { expiresIn }
    );
  }
}

import multer from 'multer';
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import config from '../config/config.js';

// Ensure uploads directory exists for local dev
if (config.NODE_ENV === 'development' && !fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// S3 Client Setup
const s3 = new S3Client({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

/**
 * Storage Selection Logic
 * - Production: S3 (NIPA)
 * - Development: Local Disk if S3 variables are not set or in local mode
 */
const isS3Configured = config.S3_ACCESS_KEY && config.S3_SECRET_KEY && config.S3_ENDPOINT && !config.S3_ENDPOINT.includes('localhost');

const s3Storage = multerS3({
  s3: s3,
  bucket: config.S3_BUCKET,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const folder = req.query.folder || 'misc';
    /**
     * FUTURE INTEGRATION:
     * Instead of raw folder from query, use storagePath utility here to generate 
     * structured keys based on business entities (Product ID, Order ID).
     * e.g., const key = storagePath.generateOrderPath(orderId, 'design', file.originalname);
     */
    cb(null, `${folder}/${Date.now().toString()}-${file.originalname}`);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = req.query.folder || 'misc';
    const uploadPath = path.join('uploads', folder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now().toString()}-${file.originalname}`);
  }
});

export const upload = multer({
  storage: isS3Configured ? s3Storage : localStorage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/octet-stream', // Common for binary files like DST
    ];

    const allowedExtensions = ['.dst', '.pes', '.emb', '.ai', '.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only images, PDFs, and production files (.dst, .pes) are allowed.`));
    }
  }
});

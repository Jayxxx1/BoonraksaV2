import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import path from "path";
import fs from "fs";
import config from "../config/config.js";

// Ensure uploads directory exists for local dev
if (config.NODE_ENV === "development" && !fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/**
 * Storage Selection Logic
 * - Production: S3
 * - Development: Local Disk if S3 variables are not set or in local mode
 */
const isValidHttpUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isS3Configured = Boolean(
  config.S3_ACCESS_KEY &&
    config.S3_SECRET_KEY &&
    config.S3_BUCKET &&
    isValidHttpUrl(config.S3_ENDPOINT) &&
    !String(config.S3_ENDPOINT).includes("localhost") &&
    !["dummy", "none", "-"].includes(
      String(config.S3_ENDPOINT).trim().toLowerCase(),
    ),
);
const useS3Storage = config.NODE_ENV !== "development" && isS3Configured;

let s3Storage = null;
if (useS3Storage) {
  const s3 = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY,
      secretAccessKey: config.S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  s3Storage = multerS3({
    s3: s3,
    bucket: config.S3_BUCKET,
    // Supabase S3 Compatibility does NOT support ACLs like 'public-read'.
    // Privacy is handled at the bucket level in Supabase Dashboard.
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = req.query.folder || "misc";
      // Multer parses file names as latin1 by default. Convert to utf8.
      let utf8Name = file.originalname;
      try {
        utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");
      } catch (e) {}

      // Sanitize filename: Remove non-alphanumeric/dot/dash characters to be ultra-safe for S3
      // This avoids characters like % from encodeURIComponent which some S3 layers reject in keys
      const extension = path.extname(utf8Name);
      const baseName = path
        .basename(utf8Name, extension)
        .replace(/[^a-zA-Z0-9]/g, "_"); // Replace Thai/Special chars with underscores

      const safeName = `${baseName}${extension}`;
      cb(null, `${folder}/${Date.now().toString()}-${safeName}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  });
}

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = req.query.folder || "misc";
    const uploadPath = path.join("uploads", folder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    let utf8Name = file.originalname;
    try {
      utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");
    } catch (e) {}
    cb(null, `${Date.now().toString()}-${utf8Name}`);
  },
});

export const upload = multer({
  storage: useS3Storage ? s3Storage : localStorage,
  limits: {
    fileSize: 1024 * 1024 * 15, // 15MB for embroidery/AI files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/octet-stream", // Common for binary files like DST
      "binary/octet-stream",
      "application/x-msdownload",
      "application/x-embroidery",
    ];

    const allowedExtensions = [
      ".dst",
      ".pes",
      ".emb",
      ".ai",
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      allowedExtensions.includes(ext)
    ) {
      cb(null, true);
    } else {
      const err = new Error(
        "Invalid file type. Allowed: images, PDF, and embroidery files (.dst, .pes, .emb).",
      );
      err.statusCode = 400;
      cb(err);
    }
  },
});

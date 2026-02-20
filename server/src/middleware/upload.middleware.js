import multer from "multer";
import path from "path";

// Memory storage to keep file in memory as Buffer for Supabase upload
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
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
      cb(
        new Error(
          `Invalid file type. Only images, PDFs, and production files (.dst, .pes) are allowed.`,
        ),
      );
    }
  },
});

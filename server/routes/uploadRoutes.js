import express from 'express';
import { upload } from '../src/middleware/upload.middleware.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload a single file to S3
 * @access  Private (should be protected by auth middleware)
 */
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // req.file contains location (S3 URL) and key (S3 Key) thanks to multer-s3
  res.status(200).json({
    success: true,
    data: {
      url: req.file.location,
      key: req.file.key,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
}));

export default router;

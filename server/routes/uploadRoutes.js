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

  // Determine the URL: req.file.location is for S3, req.file.path is for local
  let fileUrl = req.file.location;
  if (!fileUrl && req.file.path) {
    // Normalize path to URL format and add protocol/host for frontend
    const relativePath = req.file.path.replace(/\\/g, '/');
    fileUrl = `http://localhost:8000/${relativePath}`;
  }

  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      key: req.file.key || req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
}));

export default router;

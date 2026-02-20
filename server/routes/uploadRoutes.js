import express from "express";
import { upload } from "../src/middleware/upload.middleware.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";
import supabase from "../src/utils/supabase.js";
import config from "../src/config/config.js";

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload a single file to Supabase Storage
 * @access  Private
 */
router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const folder = req.query.folder || "misc";
    const fileName = `${folder}/${Date.now().toString()}-${req.file.originalname}`;

    let fileUrl = "";

    if (supabase) {
      // 1. Upload to Supabase Storage
      const bucketName = "boonraksa-storage"; // Default bucket name, make sure this exists in Supabase

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Upload Error:", error);
        return res
          .status(500)
          .json({ success: false, message: "Failed to upload to Supabase" });
      }

      // 2. Get Public URL
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      fileUrl = publicData.publicUrl;
    } else {
      // Fallback if Supabase is not configured (should not happen in prod if envs are set)
      console.warn(
        "Supabase not configured. Returning dummy URL for local dev.",
      );
      fileUrl = `http://localhost:8000/uploads/${fileName}`;
    }

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        key: fileName,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  }),
);

export default router;

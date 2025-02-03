const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());
app.use(express.json()); // Allow JSON parsing

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Store selected file details for Device B
let selectedFile = { url: null, publicId: null, originalName: null };

// Upload API (supports all file types)
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded!" });

    console.log("Uploading file:", file.originalname);

    // Upload file to Cloudinary as a raw file
    const result = await cloudinary.uploader.upload(file.path, { resource_type: "auto" });

    // Store file URL, public ID, and original name
    selectedFile = {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.originalname, // Save original filename
    };

    // Remove local temp file
    fs.unlinkSync(file.path);

    res.json({ message: "File uploaded successfully!", url: selectedFile.url, publicId: selectedFile.publicId, originalName: selectedFile.originalName });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed!" });
  }
});

// Select file for Device B
app.post("/select-file", (req, res) => {
  const { url, publicId, originalName } = req.body;
  if (url && publicId && originalName) {
    selectedFile = { url, publicId, originalName };
    console.log("File selected for Device B:", selectedFile);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid file data!" });
  }
});

// Check if a new file is available
app.get("/check-file", (req, res) => {
  if (selectedFile.url) {
    res.json({ fileAvailable: true, url: selectedFile.url, publicId: selectedFile.publicId, originalName: selectedFile.originalName });
  } else {
    res.json({ fileAvailable: false });
  }
});

// Delete file after download confirmation
app.post("/delete-file", async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) return res.status(400).json({ error: "No file ID provided!" });

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    console.log(`Deleted from Cloudinary: ${publicId}`);

    selectedFile = { url: null, publicId: null, originalName: null };
    res.json({ message: "File deleted from Cloudinary!" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file!" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

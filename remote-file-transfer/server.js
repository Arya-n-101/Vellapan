const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const fs = require("fs");
const archiver = require("archiver");
require("dotenv").config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup to handle file uploads
const upload = multer({ dest: "uploads/" });

// Store selected file for Device B
let selectedFile = { url: null, publicId: null, originalName: null, isFolder: false };

// Handle file/folder upload (ZIP folders or single files)
app.post("/upload", upload.array("files", 100), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded!" });
    }

    if (files.length === 1) {
      // Upload single file
      const result = await cloudinary.uploader.upload(files[0].path, { resource_type: "auto" });
      selectedFile = {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: files[0].originalname,
        isFolder: false,
      };
      fs.unlinkSync(files[0].path);
    } else {
      // ZIP multiple files into a folder
      const zipFileName = `folder_${Date.now()}.zip`;
      const zipFilePath = `uploads/${zipFileName}`;
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);
      files.forEach((file) => {
        archive.file(file.path, { name: file.originalname });
      });
      await archive.finalize();

      const result = await cloudinary.uploader.upload(zipFilePath, { resource_type: "raw" });
      selectedFile = {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: zipFileName,
        isFolder: true,
      };

      // Clean up temporary files
      files.forEach((file) => fs.unlinkSync(file.path));
      fs.unlinkSync(zipFilePath);
    }

    res.json({ message: "File uploaded successfully!", ...selectedFile });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed!" });
  }
});

// Select file for Device B to download
app.post("/select-file", (req, res) => {
  const { url, publicId, originalName, isFolder } = req.body;
  if (url && publicId && originalName) {
    selectedFile = { url, publicId, originalName, isFolder };
    console.log("File selected for Device B:", selectedFile);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid file/folder data!" });
  }
});

// Check for new file/folder for Device B
app.get("/check-file", (req, res) => {
  if (selectedFile.url) {
    res.json({ fileAvailable: true, ...selectedFile });
  } else {
    res.json({ fileAvailable: false });
  }
});

// Delete file/folder from Cloudinary after successful download
app.post("/delete-file", async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) return res.status(400).json({ error: "No file ID provided!" });

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    console.log(`Deleted from Cloudinary: ${publicId}`);

    selectedFile = { url: null, publicId: null, originalName: null, isFolder: false };
    res.json({ message: "File/Folder deleted from Cloudinary!" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file!" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

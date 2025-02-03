const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Folder for downloaded files
const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

// Store downloaded files
const downloadedFilesPath = path.join(__dirname, 'downloaded_files.json');
let downloadedFiles = {};
if (fs.existsSync(downloadedFilesPath)) {
  downloadedFiles = JSON.parse(fs.readFileSync(downloadedFilesPath, 'utf8'));
}

// Notify Device A to delete file after downloading
const notifyDeletion = async (publicId) => {
  try {
    console.log(`Notifying Device A to delete file: ${publicId}`);
    await axios.post("http://localhost:5000/delete-file", { publicId });
    console.log("Deletion request sent!");
  } catch (error) {
    console.error("Error notifying Device A to delete file:", error);
  }
};

// Download file and save with original name
const downloadFile = async (fileUrl, fileName, publicId) => {
  try {
    if (downloadedFiles[fileUrl]) {
      console.log(`File already downloaded: ${fileUrl}`);
      return;
    }

    console.log(`Downloading: ${fileUrl}`);

    // Ensure filename is safe for saving
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_"); // Replace unsafe characters
    const filePath = path.join(downloadFolder, safeFileName);

    // Fetch file and save to disk
    const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      console.log(`File saved: ${filePath}`);
      
      // Mark file as downloaded
      downloadedFiles[fileUrl] = fileName;
      fs.writeFileSync(downloadedFilesPath, JSON.stringify(downloadedFiles, null, 2));

      // Notify Device A to delete the file
      await notifyDeletion(publicId);
    });

    writer.on('error', (err) => {
      console.error("Error saving file:", err);
    });
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

// Check for new files
const checkForNewFile = async () => {
  try {
    const response = await axios.get("http://localhost:5000/check-file");
    const data = response.data;

    if (data.fileAvailable) {
      console.log("New file detected!");
      await downloadFile(data.url, data.originalName, data.publicId);
    } else {
      console.log("No new file available.");
    }
  } catch (error) {
    console.error("Error checking file availability:", error);
  }
};

// Poll every 5 seconds
setInterval(checkForNewFile, 5000);

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// Folder for downloads
const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

// Store downloaded files
const downloadedFilesPath = path.join(__dirname, 'downloaded_files.json');
let downloadedFiles = fs.existsSync(downloadedFilesPath)
  ? JSON.parse(fs.readFileSync(downloadedFilesPath, 'utf8'))
  : {};

// Notify Device A to delete file after download
const notifyDeletion = async (publicId) => {
  try {
    await axios.post("http://localhost:5000/delete-file", { publicId });
    console.log("Deletion request sent!");
  } catch (error) {
    console.error("Error notifying Device A:", error);
  }
};

// Download and save file/folder
const downloadFile = async (fileUrl, fileName, publicId, isFolder) => {
  try {
    if (downloadedFiles[fileUrl]) return console.log(`File already downloaded: ${fileUrl}`);

    console.log(`Downloading: ${fileUrl}`);
    const filePath = path.join(downloadFolder, fileName);

    const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      console.log(`Saved: ${filePath}`);

      if (isFolder) {
        console.log("Extracting ZIP...");
        fs.createReadStream(filePath).pipe(unzipper.Extract({ path: downloadFolder }));
      }

      downloadedFiles[fileUrl] = fileName;
      fs.writeFileSync(downloadedFilesPath, JSON.stringify(downloadedFiles, null, 2));

      await notifyDeletion(publicId);
    });

    writer.on('error', console.error);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

// Check for new file/folder
const checkForNewFile = async () => {
  try {
    const { data } = await axios.get("http://localhost:5000/check-file");
    if (data.fileAvailable) {
      await downloadFile(data.url, data.originalName, data.publicId, data.isFolder);
    } else {
      console.log("No new files.");
    }
  } catch (error) {
    console.error("Error checking files:", error);
  }
};

// Poll every 5 seconds
setInterval(checkForNewFile, 5000);

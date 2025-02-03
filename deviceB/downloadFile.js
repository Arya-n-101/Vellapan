const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Specify the folder where the file should be saved
const downloadFolder = path.join(__dirname, 'downloads');  // Folder in the current directory

// Create the folder if it doesn't exist
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

// Function to download a file and save it to the folder
const downloadFile = async (fileUrl, fileName) => {
  try {
    console.log(`Downloading file from ${fileUrl}`);

    // Make an HTTP request to fetch the file
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
    });

    // Save the file to the specified folder
    const filePath = path.join(downloadFolder, fileName);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    // Wait for the file to be fully downloaded
    writer.on('finish', () => {
      console.log(`File downloaded and saved to ${filePath}`);
    });

    writer.on('error', (err) => {
      console.error('Error saving the file:', err);
    });
  } catch (error) {
    console.error('Error downloading the file:', error);
  }
};

// Example usage: The URL and file name that Device B will download
const fileUrl = 'https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/sample.jpg';  // Replace with the actual file URL
const fileName = 'sample.jpg';  // Set the name you want to save the file as

downloadFile(fileUrl, fileName);

"use strict";

const firebaseConfig = require("../configs/config.firebase");
const { initializeApp, getApps, getApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} = require("firebase/storage");
const { v4: uuidv4 } = require("uuid");

console.log(firebaseConfig);

// Check if Firebase app already exists, otherwise initialize a new one
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(firebaseApp);

class FirebaseStorage {
  constructor() {
    this.app = firebaseApp;
    this.storage = storage;
  }

  static getInstance() {
    if (!FirebaseStorage.instance) {
      FirebaseStorage.instance = new FirebaseStorage();
    }
    return FirebaseStorage.instance;
  }

  async uploadImage(file) {
    try {
      const uniqueFileName = `${uuidv4()}-${file.originalname}`;
      const folderPath = "Hodophile";
      const storageRef = ref(this.storage, `${folderPath}/${uniqueFileName}`);
      const metadata = {
        contentType: file.mimetype,
      };
      await uploadBytes(storageRef, file.buffer, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("File uploaded successfully:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  }

  async uploadImages(files) {
    const imageUrls = [];
    for (const file of files) {
      const imageUrl = await this.uploadImage(file);
      if (imageUrl) {
        imageUrls.push(imageUrl);
      }
    }
    return imageUrls;
  }

  async deleteImage(url) {
    try {
      // Extract the storage path from the URL
      const storageRef = ref(this.storage, this.getStoragePathFromUrl(url));
      console.log("Deleting file:", url);
      await deleteObject(storageRef);
      console.log("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  async updateImage(url, file) {
    try {
      if (url) {
        try {
          await this.deleteImage(url);
        } catch (error) {
          console.error("Error deleting previous image, continuing with upload:", error);
        }
      }
      const newUrl = await this.uploadImage(file);
      return newUrl;
    } catch (error) {
      console.error("Error updating image:", error);
      return null;
    }
  }

  async updateImages(urls, files) {
    const newUrls = [];
    for (const url of urls) {
      try {
        await this.deleteImage(url);
        console.log("Deleted image:", url);
      } catch (error) {
        console.error(`Error deleting image ${url}:`, error);
      }
    }
    for (const file of files) {
      const newUrl = await this.uploadImage(file);
      if (newUrl) {
        newUrls.push(newUrl);
      }
    }
    return newUrls;
  }
  
  // Helper method to extract the storage path from URL
  getStoragePathFromUrl(url) {
    try {
      // Extract the path after storage.googleapis.com/
      const match = url.match(/storage\.googleapis\.com\/(.+?)(\?|$)/);
      if (match && match[1]) {
        // URL decode the path
        return decodeURIComponent(match[1]);
      }
      
      // For Firebase Storage URLs
      if (url.includes('firebasestorage.googleapis.com')) {
        // These URLs are more complex, extract the path component
        // Format: https://firebasestorage.googleapis.com/v0/b/bucket-name.appspot.com/o/path%2Fto%2Ffile?token...
        const match = url.match(/\/o\/(.+?)(\?|$)/);
        if (match && match[1]) {
          return decodeURIComponent(match[1]);
        }
      }
      
      // If we can't parse the URL properly, throw an error
      throw new Error(`Unable to extract storage path from URL: ${url}`);
    } catch (error) {
      console.error("Error extracting storage path:", error);
      throw error;
    }
  }
  async uploadImageBase64(base64String, fileName) {
    if(!fileName) {
      fileName = `${uuidv4()}.png`; // Default to PNG if no file name provided
    }
    try {
      const buffer = Buffer.from(base64String, 'base64');
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const folderPath = "Hodophile";
      const storageRef = ref(this.storage, `${folderPath}/${uniqueFileName}`);
      const metadata = {
        contentType: 'image/png', // Assuming PNG, adjust if needed
      };
      await uploadBytes(storageRef, buffer, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Base64 image uploaded successfully:", downloadURL);
      return downloadURL;
    }
    catch (error) {
      console.error("Error uploading base64 image:", error);
      return null;
    }
  }
  async uploadFromLocalPath(localFilePath,contentType='application/octet-stream') {
    try {
      const fs = require('fs');
      const path = require('path');
      const fileBuffer = fs.readFileSync(localFilePath);
      const fileName = path.basename(localFilePath);
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const folderPath = "Hodophile";
      const storageRef = ref(this.storage, `${folderPath}/${uniqueFileName}`);
      const metadata = {
        contentType: contentType || 'application/octet-stream', // Default to binary if not specified
      };
      await uploadBytes(storageRef, fileBuffer, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Local file uploaded successfully:", downloadURL);
      return downloadURL;
    }
    catch (error) {
      console.error("Error uploading local file:", error);
      return null;
    }
  }
}

module.exports = FirebaseStorage;

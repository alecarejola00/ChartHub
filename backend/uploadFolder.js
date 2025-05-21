const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const { ObjectId } = mongoose.Types;

const mongoURI = 'mongodb+srv://admin:t2rbPbZrsACRHH6T@cluster0.bgh38xe.mongodb.net/';
const folderPath = path.join(__dirname, 'COMPANY');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const conn = mongoose.connection;

conn.once('open', async () => {
  console.log('✅ MongoDB connected');

  const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads', // Files will go to fs.files and chunks to fs.chunks
  });

  try {
    await uploadFolderFiles(folderPath, bucket);
    console.log('🎉 All files uploaded successfully.');
  } catch (err) {
    console.error('Error uploading files:', err);
  } finally {
    mongoose.disconnect();
  }
});

conn.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

async function uploadFile(filePath, fileName, bucket) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);

    const uploadStream = bucket.openUploadStream(fileName, {
      _id: new ObjectId(),
    });

    readStream.pipe(uploadStream)
      .on('error', (error) => {
        console.error(`❌ Error uploading ${fileName}:`, error);
        reject(error);
      })
      .on('finish', () => {
        console.log(`✅ Uploaded: ${fileName}`);
        resolve();
      });
  });
}

async function uploadFolderFiles(dir, bucket) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await uploadFolderFiles(fullPath, bucket); // Recurse into subfolders
    } else {
      const relativePath = path.relative(folderPath, fullPath); // Keep folder structure
      await uploadFile(fullPath, relativePath, bucket);
    }
  }
}
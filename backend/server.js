require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const mongoURI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

let gfsBucket;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });
}).catch((err) => console.error('MongoDB connection error:', err));
// Storage engine for multer
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: file.originalname.replace(/\\/g, '/'), // Normalize slashes
      bucketName: 'uploads',
    };
  },
});

const upload = multer({ storage });

// Fetch stock data
app.get('/files/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const filename = `${symbol}\\stock.csv`; // Use backslash to match stored filenames

  try {
    const file = await mongoose.connection.db.collection('uploads.files').findOne({ filename });

    if (!file) {
      console.log(`File not found with filename: ${filename}`);
      return res.status(404).json({ error: 'CSV file not found' });
    }

    const downloadStream = gfsBucket.openDownloadStreamByName(filename);
    const results = [];

    downloadStream
      .pipe(csv())
      .on('data', (row) => {
        if (row.Date && row.Open && row.High && row.Low && row.Close && row.Volume) {
          results.push({
            time: Math.floor(new Date(row.Date).getTime() / 1000), // Unix timestamp (seconds)
            open: parseFloat(row.Open),
            high: parseFloat(row.High),
            low: parseFloat(row.Low),
            close: parseFloat(row.Close),
            volume: parseInt(row.Volume)
          });
        }
      })
      .on('end', () => {
        res.set('Content-Type', 'application/json');
        res.json(results);
      })
      .on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).json({ error: 'Error reading CSV file' });
      });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//download csv file
app.get('/download/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const filename = `${symbol}\\stock.csv`;  // match your stored filename format

    // Find file metadata
    const fileDoc = await mongoose.connection.db.collection('uploads.files').findOne({ filename });
    if (!fileDoc) {
      return res.status(404).send('CSV file not found');
    }

    // Set headers to prompt file download
    res.set({
      'Content-Type': fileDoc.contentType || 'text/csv',
      'Content-Disposition': `attachment; filename="${symbol}_stock.csv"`,
      'Content-Length': fileDoc.length,
    });

    // Stream file from GridFS to response
    const downloadStream = gfsBucket.openDownloadStreamByName(filename);

    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      res.status(404).send('CSV file not found');
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error in /download route:', err);
    res.status(500).send('Server error');
  }
});

//image storing for the plot predictions
app.get('/predictions/:symbol/:filename', async (req, res) => {
  try {
    const { symbol, filename } = req.params;
    // Use backslash to match stored filename
    const fullFilename = `${symbol}\\${filename}`;

    // Find file metadata
    const fileDoc = await mongoose.connection.db.collection('uploads.files').findOne({ filename: fullFilename });
    if (!fileDoc) {
      return res.status(404).send('Image not found');
    }

    // Set content type based on stored contentType or fallback to image/png
    res.set('Content-Type', fileDoc.contentType || 'image/png');

    // Stream the file from GridFSBucket
    const downloadStream = gfsBucket.openDownloadStreamByName(fullFilename);

    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      res.status(404).send('Image not found');
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error in /predictions route:', err);
    res.status(500).send('Server error');
  }
});

app.use('/predictions', express.static(path.join(__dirname, 'predictions')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Serve Angular static files
app.use(express.static(path.join(__dirname, '../frontend/dist/stock-record')));

// Fallback to index.html for Angular routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/stock-record/index.html'));
});
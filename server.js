const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { CognitiveServicesCredentials } = require('@azure/ms-rest-azure-js');
require('dotenv').config();

const app = express();
const port = 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Azure Configuration
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const computerVisionEndpoint = process.env.AZURE_CV_ENDPOINT;
const computerVisionKey = process.env.AZURE_CV_KEY;

const computerVisionClient = new ComputerVisionClient(
  new CognitiveServicesCredentials(computerVisionKey),
  computerVisionEndpoint
);

// Route to process image and prompt with Azure OpenAI
app.post('/api/process-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No image uploaded');
    }

    const imageBuffer = req.file.buffer;

    // Perform OCR using Azure Computer Vision
    const ocrResult = await computerVisionClient.recognizePrintedTextInStream(true, imageBuffer);
    
    // Extract all text from the OCR result
    const extractedText = ocrResult.regions
      .map(region => region.lines.map(line => line.words.map(word => word.text).join(' ')).join('\n'))
      .join('\n');

    if (!extractedText) {
      return res.status(400).send('No text found in the image');
    }

    // console.log(extractedText);   

       
    res.json({ extractedText });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send('Error processing image');
  }
});

app.get('/', (req, res)=>{
  res.send("hello world");
})
  
// Start server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

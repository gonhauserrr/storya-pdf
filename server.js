import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import PDFDocument from 'pdfkit';
import fetch from 'node-fetch';
import fs from 'fs';

import bodyParser from "body-parser";


import path from "path";

import OpenAI from "openai";

import { PDFDocument as PDFMerger } from 'pdf-lib';




const app = express();
app.use(express.json());
app.use(bodyParser.json());



const cmToPx = (cm) => cm * 67.3;
const fontScale = 2.2; // tweak visually until it matches Canva

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GENERATED_DIR = path.join(process.cwd(), "generated");
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR);

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);

  const mimeType = res.headers.get("content-type") || "image/jpeg"; // detect
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return { mimeType, base64 };
}


async function generateImage({ jobId, prompt, reference_image_url }) {
  let imageDataObj = null;
  if (reference_image_url) {
    imageDataObj = await fetchImageAsBase64(reference_image_url);
  }


  const fullPrompt = `${prompt}\n\nUse the provided image as the main reference. Preserve the person's face, hairstyle, skin tone, and clothing style exactly as shown.`;

  // Send prompt + base64 image
  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: fullPrompt },
          { type: "input_image", image_url: `data:${imageDataObj.mimeType};base64,${imageDataObj.base64}` },
        ],
      },
    ],
    tools: [{ type: "image_generation", size: "1024x1536", input_fidelity: "high" }],
  });




  const imageData = response.output.find((o) => o.type === "image_generation_call");
  if (!imageData) throw new Error("No image generated");

  const filePath = path.join(GENERATED_DIR, `${jobId}.png`);
  fs.writeFileSync(filePath, Buffer.from(imageData.result, "base64"));
  return filePath;
}


app.post("/generate-gpt-image", async (req, res) => {
  try {
    const { jobId, prompt, reference_image_url } = req.body;
    if (!jobId || !prompt) return res.status(400).json({ error: "jobId and prompt required" });

    // Immediately respond so client doesn't timeout
    res.json({ status: "started", jobId });

    // Generate image asynchronously
    generateImage({ jobId, prompt, reference_image_url }).catch(console.error);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// New: Check job status endpoint
app.get("/check-job/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const filePath = path.join(GENERATED_DIR, `${jobId}.png`);

  if (fs.existsSync(filePath)) {
    const url = `${req.protocol}://${req.get("host")}/generated/${jobId}.png`;
    return res.json({ status: "done", image_url: url });
  } else {
    return res.json({ status: "pending" });
  }
});

app.use("/generated", express.static(GENERATED_DIR));

app.post('/generate-1', async (req, res) => {
  const {
    backgroundUrl,
    characterUrl,
    texts = [], // Array of 6 strings
  } = req.body;

  if (!backgroundUrl || !characterUrl || texts.length !== 6) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    // Fetch images
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    // Create PDF
    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    doc.image(background, 0, 0, { width: 1414, height: 2000 });


    doc.image(character, cmToPx(-2.56), cmToPx(2.59), {
      width: cmToPx(17.19),
      height: cmToPx(22.92),
    });

    doc.registerFont('Lucky', 'fonts/Luckybones-Bold.ttf');


    const textLayout = [
      { x: 12.18, y: 11.9, size: 36.9 },
      { x: 12.18, y: 13.21, size: 59.4 },
      { x: 12.18, y: 15.38, size: 36.9 },
      { x: 12.18, y: 17.12, size: 52.2 },
      { x: 12.18, y: 19.31, size: 36.9 },
      { x: 12.18, y: 23.76, size: 23 },
    ];

    texts.forEach((text, i) => {
      const { x, y, size } = textLayout[i];
      doc.font('Lucky')
        .fontSize(size * fontScale) // optional scaling
        .fillColor('#401c80')
        .text(text, cmToPx(x), cmToPx(y));
    });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

app.post('/generate-2', async (req, res) => {
  const {
    backgroundUrl,
    characterUrl,
    texts = []
  } = req.body;

  if (!backgroundUrl || !characterUrl || texts.length !== 5) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const fontScale = 2.2;
    const fontColor = '#7b5c00';

    // Register custom font "CupCakes"
    doc.registerFont('CupCakes', 'fonts/CupCakes.otf');
    doc.font('CupCakes');

    const filename = 'output-2.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Draw character
    doc.image(character, cmToPx(5.54), cmToPx(-0.4), {
      width: cmToPx(15.62),
      height: cmToPx(23.43),
    });

    // Text layout
    const textLayout = [
      { x: 3.16, y: 12.38, size: 36.9 },
      { x: 3.16, y: 14.18, size: 59.4 },
      { x: 3.16, y: 16.68, size: 36.9 },
      { x: 3.16, y: 18.48, size: 52.2 }
    ];

    textLayout.forEach(({ x, y, size }, i) => {
      doc.fontSize(size * fontScale)
         .fillColor(fontColor)
         .text(texts[i], cmToPx(x), cmToPx(y));
    });

    // Text 5 – centered full width
    doc.fontSize(23 * fontScale)
       .fillColor(fontColor)
       .text(texts[4], 0, cmToPx(24.83), {
         width: 1414,
         align: 'center'
       });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});




app.post('/generate-3', async (req, res) => {
  const { backgroundUrl, texts = [] } = req.body;

  if (!backgroundUrl || texts.length !== 3) {
    return res.status(400).json({ error: 'Missing background or 3 text values' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });
    
    const filename = `output-generate-3-${Date.now()}.pdf`;


    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Register fonts
    doc.registerFont('CooperBT', 'fonts/CooperBT.ttf');
    doc.registerFont('ProximaNova-Bold', 'fonts/ProximaNova-Bold.otf'); // OTF is supported!

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    const layout = [
      {
        y: cmToPx(9.05),
        fontSize: 58.2,
        rotation: -7,
        font: 'CooperBT',
        bgColor: '#01b695',
      },
      {
        y: cmToPx(12.43),
        fontSize: 58.2,
        rotation: 3.5,
        font: 'CooperBT',
        bgColor: '#eeb3e7',
      },
      {
        y: cmToPx(15.73),
        fontSize: 24,
        rotation: -3.1,
        font: 'ProximaNova-Bold',
        bgColor: '#82a1fd',
      }
    ];

    layout.forEach((item, i) => {
      const { y, fontSize, rotation, font, bgColor } = item;
      const text = texts[i];
      const scaledFontSize = fontSize * fontScale;
      const padding = 40;
      const radius = 50;

      doc.save();

      doc.font(font).fontSize(scaledFontSize);

      const textWidth = doc.widthOfString(text);
      const textHeight = doc.currentLineHeight();

      const boxWidth = textWidth + padding * 2;
      const boxHeight = textHeight + padding;

      const centerX = 1414 / 2;
      const boxX = centerX - boxWidth / 2;
      const boxY = y;

      // Rotate around center
      const rotateCenterX = centerX;
      const rotateCenterY = boxY + boxHeight / 2;

      doc.translate(rotateCenterX, rotateCenterY)
         .rotate(rotation)
         .translate(-rotateCenterX, -rotateCenterY);

      // Draw rounded background
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, radius)
        .fill(bgColor);

      // Draw centered text
      doc.fillColor('black').text(text, boxX + padding, boxY + padding / 2, {
        width: boxWidth - padding * 2,
        align: 'center'
      });

      doc.restore();
    });

    doc.end();

    stream.on('finish', () => {
  setTimeout(() => {
    res.download(filename, () => fs.unlinkSync(filename));
  }, 200); // 200ms delay to ensure file is flushed
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

app.post('/generate-4', async (req, res) => {
  const { backgroundUrl, characterUrl, text1, text2 } = req.body;

  if (!backgroundUrl || !characterUrl || !text1 || !text2) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const cmToPx = (cm) => cm * 67.3;
  const fontScale = 2.2;

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'generate4_output.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Register fonts
    doc.registerFont('Chewy', 'fonts/Chewy-Regular.ttf');
    doc.registerFont('League', 'fonts/LeagueSpartan-Bold.ttf');

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Text 1 – Chewy
    const y1 = cmToPx(9.03);
    doc.font('Chewy')
      .fontSize(59.3 * fontScale)
      .fillColor('#401c80')
      .text(text1, 0, y1, {
        width: 1414,
        align: 'center'
      });

    // Text 2 – League Spartan
    const y2 = y1 + cmToPx(3); // adjust vertical spacing if needed
    doc.font('League')
      .fontSize(20.5 * fontScale)
      .fillColor('#401c80')
      .text(text2, 0, y2, {
        width: 1414,
        align: 'center'
      });

    // Character image
    const charX = cmToPx(3.74);
    const charY = cmToPx(7.14);
    const charHeight = 1024;
    const charImage = await fetchImage(characterUrl);

    doc.image(charImage, charX, 2000 - charHeight, {
      height: charHeight,
      align: 'bottom'
    });

    doc.end();

    stream.on('finish', () => {
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});




app.post('/generate-5', async (req, res) => {
  const {
    backgroundUrl,
    characterUrl,
    text1_line1,
    text1_line2,
    text2
  } = req.body;

  if (!backgroundUrl || !characterUrl || !text1_line1 || !text1_line2 || !text2) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const fontScale = 2.2;
    const filename = 'output-5.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Fonts
    doc.registerFont('MoreSugar', 'fonts/MoreSugar.ttf');
    doc.font('MoreSugar');

    // Shadow settings for text1
    const shadowOffsetX = 5; // Derived from -45deg direction and 50 offset
    const shadowOffsetY = 5;

    const drawTextWithShadow = (text, y) => {
      const fontSize = 58 * fontScale;
      const textWidth = doc.widthOfString(text, { font: 'MoreSugar', size: fontSize });
      const x = (1414 - textWidth) / 2;

      // Shadow
      doc.fillColor('white').opacity(0.4).fontSize(fontSize);
      doc.text(text, 0 + shadowOffsetX, y + shadowOffsetY, {
        lineBreak: false,
        align: 'center',
        width: 1414
      });

      // Main text
      doc.fillColor('white').opacity(1);
      doc.text(text, 0, y, {
        lineBreak: false,
        align: 'center',
        width: 1414
      });
    };

    // Text1 line 1 & line 2 with shadow
    drawTextWithShadow(text1_line1, cmToPx(5.42));
    drawTextWithShadow(text1_line2, cmToPx(7.8));

    // Text 2 (no shadow)
    const fontSize2 = 21 * fontScale;
    const text2Width = doc.widthOfString(text2, { font: 'MoreSugar', size: fontSize2 });
    const text2X = (1414 - text2Width) / 2;
    doc.fillColor('white').fontSize(fontSize2).text(text2, 0, cmToPx(10.10), {
      lineBreak: false,
      align: 'center',
      width: 1414
    });

    // Character Image
    const charWidth = cmToPx(10);
    const charX = (1414 - charWidth) / 2;
    doc.image(character, charX, cmToPx(14.14), {
      width: charWidth
    });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlink(filename, (err) => {
          if (err) console.error('Failed to delete file:', err);
        });
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});





app.post('/generate-7', async (req, res) => {
  const {
    backgroundUrl,
    characterUrl,
    text1_line1,
    text1_line2
  } = req.body;

  console.log('Request body:', req.body);

  if (!backgroundUrl || !characterUrl || !text1_line1 || !text1_line2) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output-template6.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    const cmToPx = (cm) => cm * 67.3;
    const fontScale = 2.2;

    // Register font
    doc.registerFont('Brush', 'fonts/Brush.otf');

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Draw character at bottom aligned
    const characterHeightPx = cmToPx(17);
    const yBottomAlign = 2000 - characterHeightPx;
    doc.image(character, cmToPx(3.74), yBottomAlign, {
      height: characterHeightPx
    });

    // Text styling
    const textColor = '#f599b0';
    const fontSize = 83.2 * fontScale;
    const yPosition = cmToPx(5.3);
    const lineGap = cmToPx(0.5); // spacing between lines

    doc.font('Brush')
       .fontSize(fontSize)
       .fillColor(textColor)
       .text(text1_line1, 0, yPosition, {
         width: 1414,
         align: 'center'
       })
       .text(text1_line2, 0, yPosition + lineGap + fontSize, {
         width: 1414,
         align: 'center'
       });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


app.post('/generate-6', async (req, res) => {
  const {
    backgroundUrl,
    text
  } = req.body;

  if (!backgroundUrl || !text) {
    return res.status(400).json({ error: 'Missing background or text parameter' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output_template6.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Register Quicksand font
    doc.registerFont('Quicksand', 'fonts/Quicksand-Regular.ttf');

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Draw text
    doc.font('Quicksand')
       .fontSize(21 * fontScale) // scaling factor to match Canva look
       .fillColor('white')
       .text(text, 0, cmToPx(25.56), {
         width: 1414,
         align: 'center'
       });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});



app.post('/generate-8', async (req, res) => {
  const { backgroundUrl, text } = req.body;

  if (!backgroundUrl || !text) {
    return res.status(400).json({ error: 'Missing background or text parameter' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output_template8.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Register font
    doc.registerFont('PlayfairItalic', 'fonts/PlayfairDisplay-Italic.ttf');


    doc.font('PlayfairItalic')
   .fontSize(17 * fontScale)
   .fillColor('black')
   .text(text, cmToPx(6.35), cmToPx(12.08), {
     width: cmToPx(8.57),
     align: 'center'
   });
    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


app.post('/generate-9', async (req, res) => {
  const { backgroundUrl, text } = req.body;

  if (!backgroundUrl || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output-template9.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Load background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Register and use Quicksand font
    doc.registerFont('Quicksand', 'fonts/Quicksand-Regular.ttf');
    doc.font('Quicksand')
       .fontSize(21 * fontScale)
       .fillColor('#401c80')
       .text(text, 0, cmToPx(24.78), {
         width: 1414,
         align: 'center'
       });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => fs.unlinkSync(filename));
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


app.post('/generate-10', async (req, res) => {
  const { backgroundUrl, text } = req.body;

  if (!backgroundUrl || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output-template10.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Register Lora Italic
    doc.registerFont('LoraItalic', 'fonts/Lora-Italic.ttf');

    // Draw text
    doc.font('LoraItalic')
       .fontSize(16.4 * fontScale)
       .fillColor('black')
       .text(text, 0, cmToPx(17.68), {
         width: 1414,
         align: 'center',
       });

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => fs.unlinkSync(filename));
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


app.post('/generate-11', async (req, res) => {
  const { backgroundUrl, text } = req.body;

  if (!backgroundUrl || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const filename = 'output-template11.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Register font
    doc.registerFont('GlacialBold', 'fonts/GlacialIndifference-Bold.otf');

    // Draw text
    doc.font('GlacialBold')
       .fontSize(24 * fontScale)
       .fillColor('black')
       .text(text, cmToPx(2.73), cmToPx(24.74));

    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => fs.unlinkSync(filename));
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});



async function fetchImage(url) {
  try {
    const res = await fetch(url, { timeout: 15000 }); // 15s timeout
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.buffer();
  } catch (err) {
    console.error(`Failed to fetch image ${url}:`, err.message);
    return null;  // or throw if you want to fail the entire job
  }
}


app.post('/generate-book', async (req, res) => {
  const { pages } = req.body;

  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  try {
    const GENERATED_DIR = path.join(process.cwd(), "generated");
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR);
    }

    // Unique filename with timestamp
    const timestamp = Date.now();
    const filename = `output-book-${timestamp}.pdf`;
    const pdfPath = path.join(GENERATED_DIR, filename);

    const doc = new PDFDocument({ size: [1414, 2000], margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Fonts
    doc.registerFont("Quicksand", "fonts/Quicksand-Bold.ttf");
    doc.registerFont("Quicksand-Bold", "fonts/Quicksand-Bold.ttf");

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i !== 0) doc.addPage();

      const bg = await fetchImage(page.background);
      doc.image(bg, 0, 0, { width: 1414, height: 2000 });

      if (page.type === 1) {
        const overlay = await fetchImage(page.overlay);
        doc.image(overlay, 0, 0, { width: 1414 });

        doc.font("Quicksand-Bold")
          .fontSize(20 * fontScale)
          .fillColor("#000000");

        const textOptions = {
          width: cmToPx(18.57),
          align: "center",
          valign: "center",
          height: page.position === "top" ? cmToPx(5.73) : cmToPx(6.71),
        };

        const textY = page.position === "top" ? cmToPx(1.29) : cmToPx(22.33);
        doc.text(page.text, cmToPx(1.21), textY, textOptions);
      }

      if (page.type === 2) {
        const character = await fetchImage(page.character);
        doc.image(character, 0, 0, { width: 1414, height: 2000 });
      }

      if (page.type === 3) {
        doc.font("Quicksand")
          .fontSize(20 * fontScale)
          .fillColor("#000000")
          .text(page.text, cmToPx(2.43), cmToPx(9.39), {
            width: cmToPx(16.13),
            height: cmToPx(7.73),
            align: "center",
            valign: "center",
          });
      }
    }

    doc.end();

    stream.on("finish", () => {
      res.download(pdfPath, filename, (err) => {
        if (err) {
          console.error("Download error:", err);
        } else {
          // Delete after sending
          setTimeout(() => {
            if (fs.existsSync(pdfPath)) {
              fs.unlinkSync(pdfPath);
            }
          }, 2000);
        }
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate book PDF" });
  }
});

const fetchNoteImage = async (url) => {
  const response = await fetch(`${url}?nocache=${Date.now()}`);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  return await response.buffer();
};
app.post('/generate-note', async (req, res) => {
  const { background, signature, text } = req.body;

  try {
    const doc = new PDFDocument({ size: [1414, 2000], margin: 0 });
    const filename = `output-note-${Date.now()}-${Math.floor(Math.random() * 1000)}.pdf`;
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Load the font
    doc.registerFont('Quicksand', 'fonts/Quicksand-Regular.ttf');

    // Draw background
    const bg = await fetchNoteImage(background);
    doc.image(bg, 0, 0, { width: 1414, height: 2000 });

       // Draw signature image
      const sigBuffer = await fetchNoteImage(signature);
      console.log('Drawing signature image');
      doc.image(sigBuffer, cmToPx(8.63), cmToPx(19.52), {
        width: cmToPx(4),
        height: cmToPx(4)
      });

    // Draw text (centered with padding)
    doc.font('Quicksand')
      .fontSize(26 * fontScale)
      .fillColor('#000000')
      .text(text, cmToPx(2), cmToPx(9.63), {
        width: 1414 - cmToPx(4), // horizontal padding
        height: cmToPx(3), // enough height to allow vertical centering
        align: 'center',
        valign: 'center'
      });



    doc.end();

    stream.on('finish', () => {
      res.download(filename, (err) => {
        if (err) {
          console.error('Download error:', err);
        } else {
          setTimeout(() => {
            try {
              fs.unlinkSync(filename);
            } catch (e) {
              console.error('Unlink error:', e.message);
            }
          }, 2000);
        }
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate note PDF' });
  }
});


app.post('/generate-background-pdf', async (req, res) => {
  const { background } = req.body;

  if (!background) {
    return res.status(400).json({ error: 'Missing background URL' });
  }

  try {
    const doc = new PDFDocument({ size: [1414, 2000], margin: 0 });
    const filename = 'background-output.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    const bgResponse = await fetch(background.startsWith('http') ? background : `https:${background}`);
    const bgBuffer = await bgResponse.buffer();

    doc.image(bgBuffer, 0, 0, { width: 1414, height: 2000 });
    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filename);
          } catch (err) {
            console.error('Error deleting file:', err.message);
          }
        }, 2000);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.post('/merge-pdfs', async (req, res) => {
  const { urls } = req.body;

  try {
    const mergedPdf = await PDFMerger.create();

    for (const url of urls) {
      const response = await fetch(url);
      const pdfBytes = await response.arrayBuffer();
      const pdf = await PDFMerger.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const finalPdfBytes = await mergedPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(finalPdfBytes));
  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).send('Error merging PDFs');
  }
});



app.post('/generate-21', async (req, res) => {
  const {
    backgroundUrl,
    characterUrl,
    imaginedBy,
  } = req.body;

  if (!backgroundUrl || !characterUrl || !imaginedBy) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const fontScale = 2.2;
    const fontColor = '#ffffff';

    // Register custom font "CupCakes"
    doc.registerFont('Quicksand', 'fonts/Quicksand-Bold.ttf');
    doc.font('Quicksand');

    const filename = 'output-21.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Draw character
    doc.image(character, cmToPx(-2), cmToPx(2.51), {
      width: cmToPx(13.7),
      height: cmToPx(18.27),
    });

    doc.fontSize(21 * fontScale)
       .fillColor(fontColor)
       .text(imaginedBy, cmToPx(8.37), cmToPx(16.82), {
         width: cmToPx(11.14),
         align: 'center'
       });


    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


app.post('/generate-22', async (req, res) => {
  const {
    backgroundUrl,
    characterUrl,
    imaginedBy,
  } = req.body;

  if (!backgroundUrl || !characterUrl || !imaginedBy) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = await fetchImage(characterUrl);

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const fontScale = 2.2;
    const fontColor = '#000000';

    // Register custom font "CupCakes"
    doc.registerFont('Kollektif', 'fonts/Kollektif-Bold.ttf');
    doc.font('Kollektif');

    const filename = 'output-21.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Draw character
    doc.image(character, cmToPx(-2), cmToPx(9), {
      width: cmToPx(15.75),
      height: cmToPx(21.01),
    });

    doc.fontSize(21 * fontScale)
       .fillColor(fontColor)
       .text(imaginedBy, cmToPx(6.46), cmToPx(14.85), {
         align: 'center'
       });


    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


app.post('/generate-background-pdf', async (req, res) => {
  const { background } = req.body;

  if (!background) {
    return res.status(400).json({ error: 'Missing background URL' });
  }

  try {
    const doc = new PDFDocument({ size: [1414, 2000], margin: 0 });
    const filename = 'background-output.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    const bgResponse = await fetch(background.startsWith('http') ? background : `https:${background}`);
    const bgBuffer = await bgResponse.buffer();

    doc.image(bgBuffer, 0, 0, { width: 1414, height: 2000 });
    doc.end();

    stream.on('finish', () => {
      res.download(filename, () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filename);
          } catch (err) {
            console.error('Error deleting file:', err.message);
          }
        }, 2000);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});



app.post('/generate-dynamic-cover', async (req, res) => {
    const {
        backgroundUrl,
        imaginedBy,
        imaginedByPosition,
        characterUrl,
        characterPosition,
        fontColor = '#000000',
        centerText = false
      } = req.body;

  if (
    !backgroundUrl ||
    !imaginedBy ||
    !imaginedByPosition ||
    typeof imaginedByPosition.x !== 'number' ||
    typeof imaginedByPosition.y !== 'number'
  ) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return await response.buffer();
    };

    const background = await fetchImage(backgroundUrl);
    const character = characterUrl ? await fetchImage(characterUrl) : null;

    const doc = new PDFDocument({
      size: [1414, 2000],
      margin: 0,
    });

    const outputPath = 'output-cover.pdf';
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.registerFont('Kollektif', 'fonts/Kollektif-Bold.ttf');
    doc.font('Kollektif');
    const fontScale = 2.2;

    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    if (
      character &&
      characterPosition &&
      typeof characterPosition.x === 'number' &&
      typeof characterPosition.y === 'number' &&
      typeof characterPosition.width === 'number' &&
      typeof characterPosition.height === 'number'
    ) {
      doc.image(character, cmToPx(characterPosition.x), cmToPx(characterPosition.y), {
        width: cmToPx(characterPosition.width),
        height: cmToPx(characterPosition.height),
      });
    }

    const textOptions = centerText
      ? {
          align: 'center',
          width: 1414
        }
      : {};

    const textX = centerText ? 0 : cmToPx(imaginedByPosition.x);
    const textY = cmToPx(imaginedByPosition.y);

    doc.fontSize(21 * fontScale)
       .fillColor(fontColor)
       .text(imaginedBy, textX, textY, textOptions);

    doc.end();

    stream.on('finish', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(outputPath);
      });
    });

  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});




const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

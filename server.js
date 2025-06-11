import express from 'express';
import PDFDocument from 'pdfkit';
import fetch from 'node-fetch';
import fs from 'fs';
import { PDFDocument as PDFMerger } from 'pdf-lib';


const app = express();
app.use(express.json());


const cmToPx = (cm) => cm * 67.3;
const fontScale = 2.2; // tweak visually until it matches Canva

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

    // Optional: Load custom font
    // doc.registerFont('CustomFont', 'fonts/YourFont.ttf');
    // doc.font('CustomFont');

    // Draw background
    doc.image(background, 0, 0, { width: 1414, height: 2000 });

    // Draw character
    doc.image(character, cmToPx(-2.56), cmToPx(2.59), {
      width: cmToPx(17.19),
      height: cmToPx(22.92),
    });

    doc.registerFont('Lucky', 'fonts/Luckybones-Bold.ttf');

    // Define text positions + sizes
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

    const filename = 'output-generate-3.pdf';
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
        width: textWidth,
        align: 'center'
      });

      doc.restore();
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
       .fontSize(21 * 2.2) // scaling factor to match Canva look
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
    const doc = new PDFDocument({ size: [1414, 2000], margin: 0 });
    const filename = 'output-book.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Load font once
    doc.registerFont('Quicksand-Bold', 'fonts/Quicksand-Bold.ttf');

        for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Only add a new page after the first
      if (i !== 0) doc.addPage();

      // Draw background image
      const bg = await fetchImage(page.background);
      doc.image(bg, 0, 0, { width: 1414, height: 2000 });

      // Type 1: Background + overlay shapes + text
      if (page.type === 1) {
        const overlay = await fetchImage(page.overlay);
        doc.image(overlay, 0, 0, { width: 1414 });

        doc.font('Quicksand-Bold')
          .fontSize(20 * fontScale)
          .fillColor('#000000');

        const textOptions = {
          width: cmToPx(18.57),
          align: 'center',
          valign: 'center',
          height: page.position === 'top' ? cmToPx(5.73) : cmToPx(6.71),
        };

        const textY = page.position === 'top' ? cmToPx(1.29) : cmToPx(22.33);
        doc.text(page.text, cmToPx(1.21), textY, textOptions);
      }

      // Type 2: Background + character image
      if (page.type === 2) {
        const character = await fetchImage(page.character);
        doc.image(character, 0, 0, { width: 1414, height: 2000 });
      }

      // Type 3: Background + text only
      if (page.type === 3) {
        
        doc.font('Quicksand-Bold')
          .fontSize(20 * fontScale)
          .fillColor('#000000')
          .text(page.text, cmToPx(2.43), cmToPx(11.39), {
            width: cmToPx(16.13),
            height: cmToPx(5.73),
            align: 'center',
            valign: 'center'
          });
      }
    }


    doc.end();

stream.on('finish', () => {
  res.download(filename, (err) => {
    if (err) {
      console.error('Download error:', err);
    } else {
      // Delay deletion to avoid EBUSY on Windows
      setTimeout(() => {
        try {
          fs.unlinkSync(filename);
        } catch (e) {
          console.error('Unlink error:', e.message);
        }
      }, 2000); // 2 second delay
    }
  });
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate book PDF' });
  }
});


app.post('/generate-note', async (req, res) => {
  const { background, signature, text } = req.body;

  try {
    const doc = new PDFDocument({ size: [1414, 2000], margin: 0 });
    const filename = 'output-note.pdf';
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Load the font
    doc.registerFont('Quicksand', 'fonts/Quicksand-Regular.ttf');

    // Draw background
    const bg = await fetchImage(background);
    doc.image(bg, 0, 0, { width: 1414, height: 2000 });

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

    // Draw signature image
    const sig = await fetchImage(signature);
    doc.image(sig, cmToPx(8.31), cmToPx(19.52), {
      width: cmToPx(4),
      height: cmToPx(4)
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



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

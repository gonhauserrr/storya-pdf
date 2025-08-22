import dotenv from "dotenv";
dotenv.config();
import express from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import OpenAI from "openai";

export const gptRouter = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENERATED_DIR = path.join(process.cwd(), "generated");
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR);

async function fetchImageAsBase64(url) {
  console.log("🔗 Fetching reference image:", url);
  const res = await fetch(url);
  console.log("📌 Response status:", res.status);

  if (!res.ok) {
    console.error("❌ Failed to fetch image:", res.statusText);
    throw new Error(`Failed to fetch image: ${res.statusText}`);
  }

  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  console.log("✅ Reference image fetched, size:", buffer.byteLength);

  return { mimeType, base64 };
}


async function generateImage({ jobId, prompt, reference_image_url, transparent_background }) {
  console.log("📌 generateImage called with:", { jobId, reference_image_url, transparent_background });

  let imageDataObj = null;
  if (reference_image_url) {
    console.log("🔗 Fetching reference image from URL:", reference_image_url);
    imageDataObj = await fetchImageAsBase64(reference_image_url);
    console.log("✅ Reference image fetched, base64 length:", imageDataObj.base64.length);
  } else {
    console.log("ℹ️ No reference image provided");
  }

  const toolConfig = { type: "image_generation", size: "1024x1536", output_format: "jpeg" };
  if (transparent_background) {
    toolConfig.background = "transparent";
    toolConfig.output_format = "png";

  }

  const fullPrompt = `Illustrate A 3D Pixar-style animation, highly detailed, cinematic lighting, soft textures, expressive cartoon characters, vibrant colors with the following info. ${prompt} in the same consistent 3D Pixar-style animation.  Do not generate realistic photography, do not use 2D illustration, do not make anime style, do not use flat design.`;

  
  console.log("📝 Sending prompt to OpenAI, length:", fullPrompt.length);

  let response;
  try {
    response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: fullPrompt },
            ...(imageDataObj ? [{ type: "input_image",image_url: `data:${imageDataObj.mimeType};base64,${imageDataObj.base64}` }] : [])
          ]
        }
      ],
      tool_choice: "required",
      tools: [toolConfig],
    });
    console.log("✅ OpenAI API call successful");
  } catch (err) {
    console.error("❌ OpenAI API call failed:", err);
    throw err;
  }

  const imageData = response.output.find(o => o.type === "image_generation_call");
  if (!imageData) {
    console.error("❌ No image generated. Full API output:", JSON.stringify(response.output, null, 2));
    throw new Error("No image generated");
  }

  const filePath = path.join(GENERATED_DIR, `${jobId}.png`);
  try {
    fs.writeFileSync(filePath, Buffer.from(imageData.result, "base64"));
    console.log("✅ File saved at:", filePath);
  } catch (err) {
    console.error("❌ Failed to write image file:", err);
    throw err;
  }

  return filePath;
}


gptRouter.post("/generate-gpt-image", async (req, res) => {
  const { jobId, prompt, reference_image_url, transparent_background } = req.body;
  
  console.log("📌 /generate-gpt-image called with:", { jobId, reference_image_url, transparent_background });

  if (!jobId || !prompt) {
    console.log("❌ Missing jobId or prompt");
    return res.status(400).json({ error: "jobId and prompt required" });
  }

  // Immediately respond so client doesn't timeout
  res.json({ status: "started", jobId });

  // Generate image asynchronously
  generateImage({
    jobId,
    prompt,
    reference_image_url,
    transparent_background: Boolean(transparent_background)
  })
  .then((filePath) => {
    console.log("✅ Image generated successfully at:", filePath);
  })
  .catch((err) => {
    console.error("❌ Error generating image:", err);
  });
});


gptRouter.get("/check-job/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const filePath = path.join(GENERATED_DIR, `${jobId}.png`);
  if (fs.existsSync(filePath)) {
    const url = `${req.protocol}://${req.get("host")}/generated/${jobId}.png`;
    return res.json({ status: "done", image_url: url });
  }
  return res.json({ status: "pending" });
});

gptRouter.use("/generated", express.static(GENERATED_DIR));

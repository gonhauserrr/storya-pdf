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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const buffer = await res.arrayBuffer();
  return { mimeType, base64: Buffer.from(buffer).toString("base64") };
}

async function generateImage({ jobId, prompt, reference_image_url, transparent_background }) {
  let imageDataObj = null;
  if (reference_image_url) {
    imageDataObj = await fetchImageAsBase64(reference_image_url);
  }

  const toolConfig = { type: "image_generation", size: "1024x1536" };
  if (transparent_background) toolConfig.background = "transparent";

  const fullPrompt = `${prompt}\n\nUse the provided image as the main reference. Preserve the person's face, hairstyle, skin tone, and clothing style exactly as shown.`;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: fullPrompt },
          ...(imageDataObj ? [{ type: "input_image", image_url: `data:${imageDataObj.mimeType};base64,${imageDataObj.base64}` }] : [])
        ]
      }
    ],
    tools: [toolConfig],
  });

  const imageData = response.output.find(o => o.type === "image_generation_call");
  if (!imageData) throw new Error("No image generated");

  const filePath = path.join(GENERATED_DIR, `${jobId}.png`);
  fs.writeFileSync(filePath, Buffer.from(imageData.result, "base64"));
  return filePath;
}

gptRouter.post("/generate-gpt-image", async (req, res) => {
  const { jobId, prompt, reference_image_url, transparent_background } = req.body;
  if (!jobId || !prompt) return res.status(400).json({ error: "jobId and prompt required" });

  res.json({ status: "started", jobId });

  generateImage({
    jobId,
    prompt,
    reference_image_url,
    transparent_background: Boolean(transparent_background)
  }).catch(console.error);
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

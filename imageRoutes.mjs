import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const jobs = {};

router.post("/generate-gpt-image", async (req, res) => {
  const { prompt, referenceImageUrl, jobId } = req.body;
  if (!prompt || !referenceImageUrl || !jobId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  jobs[jobId] = { status: "processing", file: null };

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: referenceImageUrl }
          ]
        }
      ],
      tools: [
        { type: "image_generation", size: "1024x1536"}
      ]
    });

    const imageData = response.output.find(o => o.type === "image_generation_call");
    if (imageData) {
      const imageBase64 = imageData.result;
      const filename = `generated/${jobId}.png`;
      fs.writeFileSync(filename, Buffer.from(imageBase64, "base64"));
      jobs[jobId] = { status: "done", file: filename };
    } else {
      jobs[jobId] = { status: "failed", file: null };
    }
  } catch (err) {
    console.error(err);
    jobs[jobId] = { status: "failed", file: null };
  }
});

router.get("/check-job/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

export default router;

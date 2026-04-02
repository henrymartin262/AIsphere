import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import * as MediaService from "../services/MediaService.js";

const router: ExpressRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// POST /api/media/text-to-image
// body: { prompt: string, width?: number, height?: number, n?: number }
router.post("/text-to-image", async (req, res) => {
  try {
    const { prompt, width, height, n } = req.body as {
      prompt?: string;
      width?: number;
      height?: number;
      n?: number;
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const result = await MediaService.textToImage({
      prompt: prompt.trim(),
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      n: n ? Number(n) : undefined
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Text-to-image failed";
    res.status(500).json({ error: message });
  }
});

// POST /api/media/speech-to-text
// body: multipart/form-data with field "audio" (file) and optional "language", "response_format"
router.post("/speech-to-text", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "audio file is required (field name: audio)" });
      return;
    }

    const { language, response_format } = req.body as {
      language?: string;
      response_format?: "json" | "text" | "srt" | "verbose_json";
    };

    const result = await MediaService.speechToText({
      audioBuffer: req.file.buffer,
      filename: req.file.originalname || "audio.bin",
      mimeType: req.file.mimetype || "application/octet-stream",
      language,
      responseFormat: response_format
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speech-to-text failed";
    res.status(500).json({ error: message });
  }
});

// GET /api/media/providers
// Returns list of available media providers from 0G Compute
router.get("/providers", async (_req, res) => {
  try {
    const providers = await MediaService.listMediaProviders();
    res.status(200).json({ success: true, data: providers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list media providers";
    res.status(500).json({ error: message });
  }
});

export default router;

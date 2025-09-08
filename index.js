import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === OpenAI ChatGPT / DALL·E ===
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Gemini ===
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === DeepSeek ===
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

// === RemoveBG ===
const REMOVEBG_KEY = process.env.REMOVEBG_API_KEY;

// === Routes ===

// ChatGPT
app.post("/chatgpt", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
    });

    const answer = completion.choices?.[0]?.message?.content || "No answer";
    res.json({ answer });
  } catch (err) {
    console.error("ChatGPT Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DALL·E Image
app.post("/dalle", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512",
    });

    res.json({ url: image.data[0].url });
  } catch (err) {
    console.error("DALL·E Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DeepSeek
app.post("/deepseek", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      { prompt: query },
      { headers: { Authorization: `Bearer ${DEEPSEEK_KEY}` } }
    );

    const answer = response.data?.choices?.[0]?.text || "No answer";
    res.json({ answer });
  } catch (err) {
    console.error("DeepSeek Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Gemini
app.post("/gemini", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(query);

    res.json({ answer: result.response.text() });
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// RemoveBG
app.post("/removebg", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      {
        image_url: imageUrl,
        size: "auto",
      },
      {
        headers: { "X-Api-Key": REMOVEBG_KEY },
        responseType: "arraybuffer",
      }
    );

    res.setHeader("Content-Type", "image/png");
    res.send(response.data);
  } catch (err) {
    console.error("RemoveBG Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to remove background" });
  }
});

// Favicon fix
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/", (req, res) => res.send("✅ AI Proxy Server Running!"));

app.listen(3000, () => console.log("Server running on port 3000"));

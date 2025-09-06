import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === OpenAI ChatGPT / DALL·E ===
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Gemini AI ===
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === ChatGPT Route ===
app.post("/chatgpt", async (req, res) => {
  try {
    const { query } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
    });
    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Gemini Route ===
app.post("/gemini", async (req, res) => {
  try {
    const { query } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(query);
    res.json({ answer: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === DALL·E Route ===
app.post("/dalle", async (req, res) => {
  try {
    const { prompt } = req.body;
    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512",
    });
    res.json({ url: image.data[0].url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ AI Proxy Server Running!");
});

app.listen(3000, () => console.log("Server running on port 3000"));

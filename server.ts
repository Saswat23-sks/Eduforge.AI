import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  // API Routes
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { systemPrompt, prompt, model: modelName, config } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: modelName || 'gemini-2.0-flash',
        generationConfig: config
      });

      const result = await model.generateContent([systemPrompt, prompt]);
      const response = await result.response;
      const text = response.text();
      res.json(JSON.parse(text));
    } catch (error) {
      console.error('AI Generation Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

const CHAPTER_SCRIPTS: Record<string, string> = {
  harvest:
    "Every autumn, British children collect the shiny brown seeds that fall from horse chestnut trees.",
  thread:
    "Make a hole through a conker, and thread it on a string with a knot at the end.",
  swing:
    "Your opponent holds their conker still, hanging at arm's length. Swing yours and try to hit theirs!",
  swap:
    "Then swap! Each player takes turns holding steady and swinging in a clean arc.",
  victor:
    "The first conker to break loses. The winner becomes a one-er, then a two-er after its next win, and so on!",
};

const narrationCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it in Settings > Secrets to enable voiceover narration."
    );
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeChapterAudio(chapterId: string): Promise<Buffer> {
  const cached = narrationCache.get(chapterId);
  if (cached) return cached;

  const existing = inFlightRequests.get(chapterId);
  if (existing) return existing;

  const scriptText = CHAPTER_SCRIPTS[chapterId];
  if (!scriptText) {
    throw new Error(`Unknown chapterId: ${chapterId}`);
  }

  const job = (async () => {
    const ai = getGeminiClient();
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: scriptText,
                  speechMetadata: {
                    style:
                      "Warm, cheerful British storybook narrator, clear, crisp, and lively",
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Charon" },
              },
            },
          },
        });

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error("Narration audio was empty in the model response.");
        }

        const wavBuffer = Buffer.from(base64Audio, "base64");
        narrationCache.set(chapterId, wavBuffer);
        return wavBuffer;
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await sleep(450 * (attempt + 1));
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to synthesize narration audio.");
  })();

  inFlightRequests.set(chapterId, job);
  try {
    return await job;
  } finally {
    inFlightRequests.delete(chapterId);
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/narration", async (req, res) => {
    const chapterId = String(req.query.chapterId || "");
    if (!CHAPTER_SCRIPTS[chapterId]) {
      res.status(400).json({ error: "Invalid or missing chapterId." });
      return;
    }

    try {
      const wavBuffer = await synthesizeChapterAudio(chapterId);
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(wavBuffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Narration synthesis failed.";
      const status = message.includes("GEMINI_API_KEY") ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      const indexHtml = path.join(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Build artifacts not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Conkers storybook server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

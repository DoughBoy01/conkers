import { GoogleGenAI } from "@google/genai";
import { FILES } from "./assets.gen";

// Large images are served from the public repo instead of being bundled.
const IMAGE_ORIGIN = "https://raw.githubusercontent.com/DoughBoy01/conkers/main";

interface Env {
  GEMINI_API_KEY?: string;
}

// Keep in sync with CHAPTER_SCRIPTS in server.ts.
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

const cache = new Map<string, Uint8Array>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function synthesize(chapterId: string, apiKey: string): Promise<Uint8Array> {
  const hit = cache.get(chapterId);
  if (hit) return hit;
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
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
                text: CHAPTER_SCRIPTS[chapterId],
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
          },
        },
      });
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) throw new Error("Narration audio was empty in the model response.");
      const bytes = b64ToBytes(data);
      cache.set(chapterId, bytes);
      return bytes;
    } catch (err) {
      lastError = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Narration synthesis failed.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ ok: true });
    if (url.pathname === "/api/narration") {
      const chapterId = url.searchParams.get("chapterId") || "";
      if (!CHAPTER_SCRIPTS[chapterId]) {
        return json({ error: "Invalid or missing chapterId." }, 400);
      }
      if (!env.GEMINI_API_KEY) {
        return json(
          { error: "GEMINI_API_KEY is not configured. Narration is disabled." },
          503,
        );
      }
      try {
        const wav = await synthesize(chapterId, env.GEMINI_API_KEY);
        return new Response(wav as BodyInit, {
          headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=3600" },
        });
      } catch (e) {
        return json({ error: e instanceof Error ? e.message : "Narration synthesis failed." }, 500);
      }
    }
    const proxied = url.pathname.startsWith("/src/assets/")
      ? url.pathname
      : url.pathname === "/audio/conkers-narration.mp3"
        ? "/public" + url.pathname
        : null;
    if (proxied) {
      const upstream = await fetch(IMAGE_ORIGIN + proxied, {
        cf: { cacheEverything: true, cacheTtl: 86400 },
      } as RequestInit);
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || (proxied.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg"),
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    const hit = FILES[url.pathname];
    if (!hit && url.pathname.startsWith("/audio/")) return new Response("Not found", { status: 404 });
    const file = hit ?? FILES["/index.html"];
    return new Response((file.b64 ? b64ToBytes(file.b64) : file.body) as BodyInit, {
      headers: {
        "Content-Type": file.type,
        "Cache-Control": url.pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
      },
    });
  },
};

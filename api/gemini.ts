let currentKeyIndex = 0;

type GeminiMove = {
  cell: string;
  reason: string;
};

function parseKeys() {
  return (process.env.GEMINI_KEYS || "")
    .split(/[,\s]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function extractJson(text: string): GeminiMove | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as Partial<GeminiMove>;
    if (typeof parsed.cell === "string" && typeof parsed.reason === "string") {
      return {
        cell: parsed.cell.toUpperCase(),
        reason: parsed.reason,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const keys = parseKeys();
  if (!keys.length) {
    res.status(503).json({ error: "GEMINI_KEYS is not configured" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const prompt = String(body?.prompt || "");
  const model = String(body?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash");

  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const keyIndex = currentKeyIndex % keys.length;
    const key = keys[keyIndex];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      const payload = await response.text();

      if (response.status === 403 || response.status === 429) {
        currentKeyIndex += 1;
        continue;
      }

      if (!response.ok) {
        throw new Error(`${response.status}: ${payload}`);
      }

      const parsed = JSON.parse(payload);
      const text =
        parsed?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || payload;
      const move = extractJson(text);

      if (!move) {
        throw new Error("Gemini returned invalid JSON");
      }

      res.status(200).json({
        move,
        keyIndex,
        status: `KEY_${String(keyIndex + 1).padStart(2, "0")} active`,
      });
      return;
    } catch {
      currentKeyIndex += 1;
    }
  }

  res.status(503).json({ error: "All Gemini keys failed" });
}

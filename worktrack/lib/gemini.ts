const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export class AIInsightsError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "AIInsightsError";
  }
}

function normalizeGeminiError(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (
    msg.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota")
  ) {
    throw new AIInsightsError(
      "DeepSeek rate limit or quota exceeded. Check your DeepSeek balance/limits, or try again later.",
      429
    );
  }

  if (
    lower.includes("api key") ||
    lower.includes("permission denied") ||
    lower.includes("unauthorized") ||
    msg.includes("401")
  ) {
    throw new AIInsightsError(
      "DeepSeek authentication failed. Check DEEPSEEK_API_KEY.",
      401
    );
  }

  if (msg.includes("404")) {
    throw new AIInsightsError(
      "DeepSeek endpoint not found. Set DEEPSEEK_BASE_URL to https://api.deepseek.com/v1 (or leave default).",
      404
    );
  }

  throw new AIInsightsError(`DeepSeek request failed: ${msg}`, 500);
}

export async function analyzeWeek(weekData: unknown): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new AIInsightsError("DEEPSEEK_API_KEY is not set", 500);

  const modelId = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL;

  const prompt = `You are a productivity analyst. Analyze this work week data and provide insights in markdown format with these sections:
## 📊 Week Summary
## 🏆 Most Productive Day
## 😴 Least Productive Day
## 🔍 Work Patterns
## 💡 Suggestions to Improve

Data: ${JSON.stringify(weekData)}`;

  const requestBody = JSON.stringify({
    model: modelId,
    messages: [
      {
        role: "system",
        content:
          "You are a productivity analyst that returns concise, useful markdown insights.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
  });

  const callDeepSeek = async (url: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: requestBody,
    });

  try {
    const rawBase = baseUrl.replace(/\/+$/, "");
    let response = await callDeepSeek(`${rawBase}/chat/completions`);

    // Some DeepSeek setups require /v1 prefix (OpenAI-compatible path).
    if (!response.ok && response.status === 404 && !rawBase.endsWith("/v1")) {
      response = await callDeepSeek(`${rawBase}/v1/chat/completions`);
    }

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}${bodyText ? `: ${bodyText}` : ""}`
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = json.choices?.[0]?.message?.content;
    if (!text?.trim()) {
      throw new AIInsightsError("Empty response from DeepSeek", 502);
    }
    return text;
  } catch (error) {
    normalizeGeminiError(error);
  }
}

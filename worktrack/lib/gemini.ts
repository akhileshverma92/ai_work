import { GoogleGenerativeAI } from "@google/generative-ai";

/** See https://ai.google.dev/gemini-api/docs/models — 1.5 bare names often 404; use 2.x/2.5 stable IDs. */
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export async function analyzeWeek(weekData: unknown): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const modelId =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelId });

  const prompt = `You are a productivity analyst. Analyze this work week data and provide insights in markdown format with these sections:
## 📊 Week Summary
## 🏆 Most Productive Day
## 😴 Least Productive Day
## 🔍 Work Patterns
## 💡 Suggestions to Improve

Data: ${JSON.stringify(weekData)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text?.trim()) throw new Error("Empty response from Gemini");
  return text;
}

import { NextResponse } from "next/server";
import { analyzeWeek, AIInsightsError } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { weekData } = body as { weekData?: unknown };
    if (weekData === undefined) {
      return NextResponse.json({ error: "weekData is required" }, { status: 400 });
    }

    const insights = await analyzeWeek(weekData);
    return NextResponse.json({ insights });
  } catch (e) {
    const status = e instanceof AIInsightsError ? e.status : 500;
    const msg =
      e instanceof Error ? e.message : "Failed to generate insights";
    return NextResponse.json({ error: msg }, { status });
  }
}

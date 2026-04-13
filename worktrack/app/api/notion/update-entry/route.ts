import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion";
import type { PageObjectResponse } from "@notionhq/client";
import { getDateValue } from "@/lib/notion";

function dateProp(iso: string) {
  return { date: { start: iso } };
}

function numProp(n: number) {
  return { number: Math.round(n * 1000) / 1000 };
}

function parseMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function diffMins(a: string | undefined, b: string | undefined): number {
  const ma = parseMs(a);
  const mb = parseMs(b);
  if (ma === null || mb === null) return 0;
  return Math.max(0, (mb - ma) / 60000);
}

function buildPropertiesFromUpdates(
  updates: Record<string, unknown>
): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined || val === null) continue;
    if (key === "Date" && typeof val === "string") {
      props[key] = { date: { start: val } };
      continue;
    }
    if (
      key === "Login" ||
      key === "Logout" ||
      key === "Break Start" ||
      key === "Break End" ||
      key === "Lunch Start" ||
      key === "Lunch End"
    ) {
      if (typeof val === "string") props[key] = dateProp(val);
      continue;
    }
    if (key === "Break Duration" || key === "Lunch Duration" || key === "Total Work Hours") {
      if (typeof val === "number") props[key] = numProp(val);
    }
  }

  return props;
}

function computeTotals(page: PageObjectResponse, logoutIso: string) {
  const login = getDateValue(page, "Login")?.start;
  const logout = logoutIso || getDateValue(page, "Logout")?.start;
  const bs = getDateValue(page, "Break Start")?.start;
  const be = getDateValue(page, "Break End")?.start;
  const ls = getDateValue(page, "Lunch Start")?.start;
  const le = getDateValue(page, "Lunch End")?.start;

  let breakMins = 0;
  if (bs && be) breakMins = diffMins(bs, be);
  else if (bs && !be) breakMins = diffMins(bs, logout ?? undefined);

  let lunchMins = 0;
  if (ls && le) lunchMins = diffMins(ls, le);
  else if (ls && !le) lunchMins = diffMins(ls, logout ?? undefined);

  const loginMs = parseMs(login ?? undefined);
  const logoutMs = parseMs(logout ?? undefined);
  let totalWorkHours = 0;
  if (loginMs !== null && logoutMs !== null && logoutMs >= loginMs) {
    const totalMins = (logoutMs - loginMs) / 60000;
    totalWorkHours = Math.max(0, (totalMins - breakMins - lunchMins) / 60);
  }

  return { breakMins, lunchMins, totalWorkHours };
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { pageId, updates } = body as {
      pageId?: string;
      updates?: Record<string, unknown>;
    };

    if (!pageId || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "pageId and updates are required" },
        { status: 400 }
      );
    }

    const notion = getNotionClient();
    const props = buildPropertiesFromUpdates(updates);

    if (Object.keys(props).length > 0) {
      await notion.pages.update({
        page_id: pageId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: props as any,
      });
    }

    if (typeof updates["Logout"] === "string") {
      const full = (await notion.pages.retrieve({
        page_id: pageId,
      })) as PageObjectResponse;

      const { breakMins, lunchMins, totalWorkHours } = computeTotals(
        full,
        updates["Logout"]
      );

      await notion.pages.update({
        page_id: pageId,
        properties: {
          "Break Duration": numProp(breakMins),
          "Lunch Duration": numProp(lunchMins),
          "Total Work Hours": numProp(totalWorkHours),
        } as Parameters<typeof notion.pages.update>[0]["properties"],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update entry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

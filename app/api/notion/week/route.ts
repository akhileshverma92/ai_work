import { NextResponse } from "next/server";
import {
  filterFullPages,
  getDataSourceId,
  getDateValue,
  getNotionClient,
  getNumber,
  getRichText,
} from "@/lib/notion";
import type { PageObjectResponse } from "@notionhq/client";

function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const endDate =
      searchParams.get("endDate") || new Date().toISOString().slice(0, 10);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "7", 10)));
    const startDate = addDays(endDate, -(days - 1));

    const notion = getNotionClient();
    const data_source_id = getDataSourceId();

    const pages: PageObjectResponse[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.dataSources.query({
        data_source_id,
        filter: {
          and: [
            { property: "Date", date: { on_or_after: startDate } },
            { property: "Date", date: { on_or_before: endDate } },
          ],
        },
        sorts: [{ property: "Date", direction: "descending" }],
        page_size: 100,
        start_cursor: cursor,
      });
      pages.push(...filterFullPages(res.results));
      cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
    } while (cursor);
    const entries = pages.map((p) => ({
      date: getDateValue(p, "Date")?.start ?? "",
      day: getRichText(p, "Day") || weekdayFromDate(getDateValue(p, "Date")?.start),
      totalWorkHours: getNumber(p, "Total Work Hours"),
      loginTime: getDateValue(p, "Login")?.start ?? null,
      logoutTime: getDateValue(p, "Logout")?.start ?? null,
      breakDuration: getNumber(p, "Break Duration"),
      lunchDuration: getNumber(p, "Lunch Duration"),
    }));

    return NextResponse.json({ entries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch week";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function weekdayFromDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

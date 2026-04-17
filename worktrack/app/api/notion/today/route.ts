import { NextResponse } from "next/server";
import {
  filterFullPages,
  getDataSourceId,
  getDateValue,
  getNotionClient,
  getNumber,
  getRichText,
  getTitle,
} from "@/lib/notion";
import type { PageObjectResponse } from "@notionhq/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "date query required (YYYY-MM-DD)" }, { status: 400 });
    }

    const notion = getNotionClient();
    const data_source_id = getDataSourceId();

    const res = await notion.dataSources.query({
      data_source_id,
      filter: {
        property: "Date",
        date: { equals: date },
      },
      page_size: 1,
    });

    const pages = filterFullPages(res.results);
    const page = pages[0];
    if (!page) {
      return NextResponse.json({ entry: null });
    }

    return NextResponse.json({ entry: serializePage(page) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch today";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function serializePage(page: PageObjectResponse) {
  return {
    pageId: page.id,
    name: getTitle(page),
    date: getDateValue(page, "Date")?.start ?? null,
    day: getRichText(page, "Day"),
    month: getRichText(page, "Month"),
    loginTime: getDateValue(page, "Login")?.start ?? null,
    logoutTime: getDateValue(page, "Logout")?.start ?? null,
    breakStart: getDateValue(page, "Break Start")?.start ?? null,
    breakEnd: getDateValue(page, "Break End")?.start ?? null,
    breakDuration: getNumber(page, "Break Duration"),
    lunchStart: getDateValue(page, "Lunch Start")?.start ?? null,
    lunchEnd: getDateValue(page, "Lunch End")?.start ?? null,
    lunchDuration: getNumber(page, "Lunch Duration"),
    totalWorkHours: getNumber(page, "Total Work Hours"),
  };
}

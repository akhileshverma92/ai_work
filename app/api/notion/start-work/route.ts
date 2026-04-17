import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDataSourceId, getNotionClient } from "@/lib/notion";
import { ACCESS_COOKIE_NAME } from "@/lib/access";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Read-only access: owner role required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { date, day, month, loginTime } = body as {
      date?: string;
      day?: string;
      month?: string;
      loginTime?: string;
    };

    if (!date || !day || !month || !loginTime) {
      return NextResponse.json(
        { error: "date, day, month, and loginTime are required" },
        { status: 400 }
      );
    }

    const notion = getNotionClient();
    const data_source_id = getDataSourceId();

    const page = await notion.pages.create({
      parent: { data_source_id },
      properties: {
        Name: {
          title: [{ type: "text", text: { content: date } }],
        },
        Date: {
          date: { start: date },
        },
        Day: {
          rich_text: [{ type: "text", text: { content: day } }],
        },
        Month: {
          rich_text: [{ type: "text", text: { content: month } }],
        },
        Login: {
          date: { start: loginTime },
        },
      },
    });

    return NextResponse.json({ pageId: page.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create entry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import {
  Client,
  isFullPage,
  type PageObjectResponse,
  type QueryDataSourceResponse,
} from "@notionhq/client";

export type { PageObjectResponse };

export function getNotionClient(): Client {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new Error("NOTION_API_KEY is not set");
  return new Client({ auth: key });
}

export function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error("NOTION_DATABASE_ID is not set");
  return id;
}

/** Used for querying / creating rows (Notion API 2025+ uses data sources). */
export function getDataSourceId(): string {
  const id = process.env.NOTION_DATA_SOURCE_ID;
  if (!id) throw new Error("NOTION_DATA_SOURCE_ID is not set");
  return id;
}

export function getTitle(page: PageObjectResponse): string {
  const name = page.properties["Name"];
  if (name?.type !== "title") return "";
  return name.title.map((t) => t.plain_text).join("") || "";
}

export function getRichText(page: PageObjectResponse, key: string): string {
  const p = page.properties[key];
  if (p?.type !== "rich_text") return "";
  return p.rich_text.map((t) => t.plain_text).join("");
}

export function getNumber(page: PageObjectResponse, key: string): number | null {
  const p = page.properties[key];
  if (p?.type !== "number") return null;
  return p.number ?? null;
}

export function getDateValue(
  page: PageObjectResponse,
  key: string
): { start: string; end: string | null } | null {
  const p = page.properties[key];
  if (p?.type !== "date" || !p.date?.start) return null;
  return { start: p.date.start, end: p.date.end ?? null };
}

export function filterFullPages(
  results: QueryDataSourceResponse["results"]
): PageObjectResponse[] {
  return results.filter((r): r is PageObjectResponse => isFullPage(r));
}

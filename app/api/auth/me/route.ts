import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, isAccessCookieValue } from "@/lib/access";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const role = isAccessCookieValue(raw) ? raw : null;
  return NextResponse.json({ role });
}

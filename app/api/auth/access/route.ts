import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_VALUE,
  getAccessPassword,
} from "@/lib/access";

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const expected = getAccessPassword();

    if (!expected) {
      return NextResponse.json(
        { error: "APP_ACCESS_PASSWORD is not configured" },
        { status: 500 }
      );
    }

    if (!password || password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: ACCESS_COOKIE_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

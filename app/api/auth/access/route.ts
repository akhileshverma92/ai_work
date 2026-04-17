import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getOwnerPassword,
  getViewerPassword,
  resolveRoleByPassword,
} from "@/lib/access";

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const ownerPassword = getOwnerPassword();
    const viewerPassword = getViewerPassword();

    if (!ownerPassword && !viewerPassword) {
      return NextResponse.json(
        {
          error:
            "Configure APP_OWNER_PASSWORD (and optionally APP_VIEWER_PASSWORD)",
        },
        { status: 500 }
      );
    }

    const role = resolveRoleByPassword(password ?? "");
    if (!role) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, role });
    res.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: role,
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

import { NextRequest, NextResponse } from "next/server";
import { buildMetaAuthUrl } from "@/lib/meta";

// Kullanıcıyı Facebook Login izin ekranına yönlendirir (CSRF state korumalı).
export async function GET(req: NextRequest) {
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildMetaAuthUrl(req.nextUrl.origin, state));
  res.cookies.set("m_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}

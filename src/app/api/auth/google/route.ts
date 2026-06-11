import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google";

// Kullanıcıyı Google izin ekranına yönlendirir. CSRF koruması için
// rastgele bir state üretilir ve çereze yazılır; callback'te doğrulanır.
export async function GET(req: NextRequest) {
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildAuthUrl(req.nextUrl.origin, state));
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}

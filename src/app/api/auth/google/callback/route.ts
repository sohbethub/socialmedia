import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeCode } from "@/lib/google";

// Google izin ekranından dönüş: yetki kodunu token'larla değiştirir,
// kanal bilgisini çekip Account kaydını oluşturur/günceller.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${origin}/accounts?error=${error}`);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get("g_oauth_state")?.value;
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${origin}/accounts?error=invalid_state`);
  }

  const tokens = await exchangeCode(code, origin);

  // Bağlanan kanalın kimliğini ve adını al
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  if (!channelRes.ok) {
    return NextResponse.redirect(`${origin}/accounts?error=channel_fetch_failed`);
  }
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];
  if (!channel) {
    return NextResponse.redirect(`${origin}/accounts?error=no_channel`);
  }

  const tokenData = {
    displayName: channel.snippet.title as string,
    accessToken: tokens.access_token,
    tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    // prompt=consent her seferinde refresh token döndürür; yine de yoksa eskisini koru
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
  };

  await db.account.upsert({
    where: {
      platform_externalId: { platform: "YOUTUBE", externalId: channel.id },
    },
    create: { platform: "YOUTUBE", externalId: channel.id, ...tokenData },
    update: tokenData,
  });

  const res = NextResponse.redirect(`${origin}/accounts?connected=youtube`);
  res.cookies.delete("g_oauth_state");
  return res;
}

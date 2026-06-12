import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeMetaCode, findInstagramAccount } from "@/lib/meta";

// Facebook Login dönüşü: uzun ömürlü token alınır, sayfaya bağlı Instagram
// Business hesabı bulunur ve Account kaydı oluşturulur/güncellenir.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${origin}/accounts?error=${error}`);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get("m_oauth_state")?.value;
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${origin}/accounts?error=invalid_state`);
  }

  try {
    const { accessToken, expiresAt } = await exchangeMetaCode(code, origin);
    const ig = await findInstagramAccount(accessToken);

    const tokenData = {
      displayName: `@${ig.username}`,
      accessToken,
      tokenExpiry: expiresAt,
    };
    await db.account.upsert({
      where: {
        platform_externalId: { platform: "INSTAGRAM", externalId: ig.igUserId },
      },
      create: { platform: "INSTAGRAM", externalId: ig.igUserId, ...tokenData },
      update: tokenData,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "meta_connection_failed";
    return NextResponse.redirect(
      `${origin}/accounts?error=${encodeURIComponent(message.slice(0, 200))}`,
    );
  }

  const res = NextResponse.redirect(`${origin}/accounts?connected=instagram`);
  res.cookies.delete("m_oauth_state");
  return res;
}

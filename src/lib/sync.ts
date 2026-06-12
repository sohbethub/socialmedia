// Bağlı hesapların içerik, metrik ve yorumlarını veritabanına senkronize eder.
// /api/cron tarafından periyodik çağrılır.
import type { Account } from "@prisma/client";
import { db } from "./db";
import { getValidAccessToken } from "./google";
import { getMetaToken } from "./meta";
import { classifySentiment } from "./replies";
import { InstagramClient } from "./platforms/instagram";
import { YouTubeClient } from "./platforms/youtube";
import type { PlatformClient } from "./platforms/types";

async function clientFor(account: Account): Promise<PlatformClient | null> {
  if (!account.accessToken) return null; // demo hesap
  switch (account.platform) {
    case "YOUTUBE":
      return new YouTubeClient(await getValidAccessToken(account.id));
    case "INSTAGRAM":
      return new InstagramClient(getMetaToken(account), account.externalId);
    default:
      return null;
  }
}

export interface SyncResult {
  account: string;
  posts: number;
  snapshots: number;
  newComments: number;
  error?: string;
}

export async function syncAccount(account: Account): Promise<SyncResult> {
  const result: SyncResult = {
    account: account.displayName,
    posts: 0,
    snapshots: 0,
    newComments: 0,
  };

  const client = await clientFor(account);
  if (!client) return result;

  const posts = await client.getPosts();

  for (const p of posts) {
    const post = await db.post.upsert({
      where: {
        accountId_externalId: { accountId: account.id, externalId: p.externalId },
      },
      create: {
        accountId: account.id,
        externalId: p.externalId,
        title: p.title,
        description: p.description,
        permalink: p.permalink,
        publishedAt: p.publishedAt,
      },
      update: { title: p.title, description: p.description, syncedAt: new Date() },
    });
    result.posts++;

    const metrics = await client.getMetrics(p.externalId);
    await db.metricSnapshot.create({ data: { postId: post.id, ...metrics } });
    result.snapshots++;

    // Yorum senkronu: yorum sayısı sıfırsa kota harcama
    if (metrics.comments > 0) {
      const comments = await client.getComments(p.externalId);
      for (const c of comments) {
        const existing = await db.comment.findUnique({
          where: { postId_externalId: { postId: post.id, externalId: c.externalId } },
        });
        if (existing) continue;
        await db.comment.create({
          data: {
            postId: post.id,
            externalId: c.externalId,
            authorName: c.authorName,
            text: c.text,
            sentiment: classifySentiment(c.text),
            publishedAt: c.publishedAt,
          },
        });
        result.newComments++;
      }
    }
  }

  return result;
}

export async function syncAllAccounts(): Promise<SyncResult[]> {
  const accounts = await db.account.findMany({
    where: { accessToken: { not: null } },
  });

  const results: SyncResult[] = [];
  for (const account of accounts) {
    try {
      results.push(await syncAccount(account));
    } catch (e) {
      results.push({
        account: account.displayName,
        posts: 0,
        snapshots: 0,
        newComments: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}

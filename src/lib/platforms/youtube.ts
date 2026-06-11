import type {
  PlatformClient,
  PlatformPost,
  PlatformMetrics,
  PlatformComment,
  PublishDraft,
} from "./types";

const API = "https://www.googleapis.com/youtube/v3";

// YouTube Data API v3 istemcisi.
// Erişim anahtarı getValidAccessToken (src/lib/google.ts) ile alınmalı;
// bu sınıf token yenilemeyle ilgilenmez.
export class YouTubeClient implements PlatformClient {
  readonly platform = "YOUTUBE" as const;

  constructor(private accessToken: string) {}

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = `${API}/${path}?${new URLSearchParams(params)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`YouTube API ${path} hatası (${res.status}): ${await res.text()}`);
    }
    return res.json();
  }

  async getPosts(): Promise<PlatformPost[]> {
    // Kanalın "uploads" oynatma listesi tüm videoları içerir
    const channels = await this.get<{
      items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
    }>("channels", { part: "contentDetails", mine: "true" });

    const uploadsId = channels.items?.[0]?.contentDetails.relatedPlaylists.uploads;
    if (!uploadsId) return [];

    const posts: PlatformPost[] = [];
    let pageToken: string | undefined;

    do {
      const page = await this.get<{
        items?: {
          snippet: { title: string; description: string; publishedAt: string };
          contentDetails: { videoId: string };
        }[];
        nextPageToken?: string;
      }>("playlistItems", {
        part: "snippet,contentDetails",
        playlistId: uploadsId,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      });

      for (const item of page.items ?? []) {
        posts.push({
          externalId: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description || undefined,
          permalink: `https://youtube.com/watch?v=${item.contentDetails.videoId}`,
          publishedAt: new Date(item.snippet.publishedAt),
        });
      }
      pageToken = page.nextPageToken;
    } while (pageToken && posts.length < 200); // kota koruması: en fazla 200 video

    return posts;
  }

  async getMetrics(postExternalId: string): Promise<PlatformMetrics> {
    const data = await this.get<{
      items?: {
        statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      }[];
    }>("videos", { part: "statistics", id: postExternalId });

    const stats = data.items?.[0]?.statistics;
    return {
      views: Number(stats?.viewCount ?? 0),
      likes: Number(stats?.likeCount ?? 0),
      comments: Number(stats?.commentCount ?? 0),
      shares: 0, // YouTube API paylaşım sayısı vermez
      saves: 0,
    };
  }

  async getComments(postExternalId: string): Promise<PlatformComment[]> {
    const data = await this.get<{
      items?: {
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              authorDisplayName: string;
              textDisplay: string;
              publishedAt: string;
            };
          };
        };
      }[];
    }>("commentThreads", {
      part: "snippet",
      videoId: postExternalId,
      maxResults: "50",
      order: "time",
    });

    return (data.items ?? []).map((t) => {
      const c = t.snippet.topLevelComment;
      return {
        externalId: c.id,
        authorName: c.snippet.authorDisplayName,
        text: c.snippet.textDisplay,
        publishedAt: new Date(c.snippet.publishedAt),
      };
    });
  }

  async replyToComment(commentExternalId: string, text: string): Promise<void> {
    const res = await fetch(`${API}/comments?part=snippet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: { parentId: commentExternalId, textOriginal: text },
      }),
    });
    if (!res.ok) {
      throw new Error(`YouTube yorum yanıtı gönderilemedi (${res.status}): ${await res.text()}`);
    }
  }

  async publishPost(_draft: PublishDraft): Promise<string> {
    // Video yükleme (resumable upload) Faz 5'te eklenecek
    throw new Error("YouTube video yükleme henüz uygulanmadı (Faz 5)");
  }
}

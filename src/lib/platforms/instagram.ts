import type {
  PlatformClient,
  PlatformPost,
  PlatformMetrics,
  PlatformComment,
  PublishDraft,
} from "./types";

const GRAPH = "https://graph.facebook.com/v23.0";

// Instagram Graph API istemcisi (Business/Creator hesaplar).
// Token geçerliliği getMetaToken (src/lib/meta.ts) ile kontrol edilmeli.
export class InstagramClient implements PlatformClient {
  readonly platform = "INSTAGRAM" as const;

  constructor(
    private accessToken: string,
    private igUserId: string,
  ) {}

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = `${GRAPH}/${path}?${new URLSearchParams({ ...params, access_token: this.accessToken })}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Instagram API ${path} hatası (${res.status}): ${await res.text()}`);
    }
    return res.json();
  }

  async getPosts(): Promise<PlatformPost[]> {
    const posts: PlatformPost[] = [];
    let after: string | undefined;

    do {
      const page = await this.get<{
        data?: {
          id: string;
          caption?: string;
          permalink?: string;
          timestamp: string;
        }[];
        paging?: { cursors?: { after?: string }; next?: string };
      }>(`${this.igUserId}/media`, {
        fields: "id,caption,permalink,timestamp",
        limit: "50",
        ...(after ? { after } : {}),
      });

      for (const m of page.data ?? []) {
        const caption = (m.caption ?? "").trim();
        posts.push({
          externalId: m.id,
          title: caption ? caption.slice(0, 80) : "(açıklamasız gönderi)",
          description: caption || undefined,
          permalink: m.permalink,
          publishedAt: new Date(m.timestamp),
        });
      }
      after = page.paging?.next ? page.paging?.cursors?.after : undefined;
    } while (after && posts.length < 200); // kota koruması

    return posts;
  }

  async getMetrics(postExternalId: string): Promise<PlatformMetrics> {
    // Beğeni ve yorum sayısı medya alanlarından gelir
    const media = await this.get<{ like_count?: number; comments_count?: number }>(
      postExternalId,
      { fields: "like_count,comments_count" },
    );

    // İzlenme/paylaşım/kaydetme insights ucundan gelir; bazı medya türleri
    // bazı metrikleri desteklemez — hata durumunda sıfırla devam edilir.
    let views = 0;
    let shares = 0;
    let saves = 0;
    try {
      const insights = await this.get<{
        data?: { name: string; values?: { value?: number }[] }[];
      }>(`${postExternalId}/insights`, { metric: "views,shares,saved" });
      for (const m of insights.data ?? []) {
        const value = m.values?.[0]?.value ?? 0;
        if (m.name === "views") views = value;
        if (m.name === "shares") shares = value;
        if (m.name === "saved") saves = value;
      }
    } catch {
      // insights desteklenmeyen medya türü — temel metriklerle yetin
    }

    return {
      views,
      likes: media.like_count ?? 0,
      comments: media.comments_count ?? 0,
      shares,
      saves,
    };
  }

  async getComments(postExternalId: string): Promise<PlatformComment[]> {
    const data = await this.get<{
      data?: { id: string; text?: string; username?: string; timestamp: string }[];
    }>(`${postExternalId}/comments`, {
      fields: "id,text,username,timestamp",
      limit: "50",
    });

    return (data.data ?? []).map((c) => ({
      externalId: c.id,
      authorName: c.username ?? "instagram-kullanicisi",
      text: c.text ?? "",
      publishedAt: new Date(c.timestamp),
    }));
  }

  async replyToComment(commentExternalId: string, text: string): Promise<void> {
    const res = await fetch(`${GRAPH}/${commentExternalId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: text, access_token: this.accessToken }),
    });
    if (!res.ok) {
      throw new Error(`Instagram yorum yanıtı gönderilemedi (${res.status}): ${await res.text()}`);
    }
  }

  async publishPost(_draft: PublishDraft): Promise<string> {
    // Content publishing (medya yükleme + yayın) Faz 5'te eklenecek
    throw new Error("Instagram içerik yayınlama henüz uygulanmadı (Faz 5)");
  }
}

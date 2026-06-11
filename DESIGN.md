# Sosyal Medya Yönetim Paneli — Tasarım Dokümanı

## 1. Amaç

Instagram ve YouTube hesaplarımızı tek bir panelden yönetmek:

- **Analiz**: Paylaştığımız videoların izlenme, beğeni, yorum, etkileşim oranı gibi
  metriklerini takip etmek; zaman içindeki değişimi grafiklerle görmek.
- **Büyüme**: "Daha fazla nasıl izleniriz, kanal nasıl büyür?" sorusuna veriye dayalı
  öneriler üretmek (en iyi paylaşım saati, en çok tutan içerik türü, başlık/etiket analizi).
- **Etkileşim**: Gelen yorumları tek yerden görmek, yorumun içeriğine göre uygun
  yanıtlar oluşturup platforma göndermek.
- **Planlama**: Paylaşımları takvim üzerinde planlamak ve zamanı gelince otomatik
  yayınlamak (veya hatırlatmak).

Tek kullanıcı / küçük ekip için tasarlanmıştır; çok kiracılı (SaaS) değildir.

## 2. Teknoloji Yığını

| Katman | Seçim | Gerekçe |
|---|---|---|
| Uygulama | Next.js (App Router) + TypeScript | Arayüz + API tek kod tabanında, tek dil |
| Arayüz | React 19 + Tailwind CSS 4 | Hızlı, modern panel geliştirme |
| Veritabanı | SQLite (Prisma ORM) | Tek kullanıcı için sıfır kurulum; Prisma sayesinde ileride PostgreSQL'e geçiş kolay |
| Doğrulama | Zod | API girdilerinin tip güvenliği |
| Zamanlama | Cron tetikleyicili API rotası (`/api/cron`) | Metrik toplama ve planlı paylaşım yayını |
| AI (ileride) | Claude API | Yorum yanıt taslakları ve büyüme önerileri — Faz 4'te eklenecek |

## 3. Platform Entegrasyonları

### YouTube (Google / YouTube Data API v3)
- **Bağlantı**: Google OAuth 2.0 (offline access + refresh token).
- **Okuma**: kanal istatistikleri, video listesi, video metrikleri (izlenme, beğeni,
  yorum sayısı), yorum konuları (commentThreads).
- **Yazma**: yorum yanıtlama (`comments.insert`), video yükleme (`videos.insert`).
- **Kota**: günlük 10.000 birim; metrik toplama işleri kotaya göre seyrekleştirilir.

### Instagram (Meta Graph API)
- **Şart**: Business veya Creator hesabı + bağlı Facebook sayfası.
- **Bağlantı**: Meta OAuth (uzun ömürlü erişim anahtarı, ~60 gün, yenilenebilir).
- **Okuma**: medya listesi, insights (erişim, izlenme, beğeni, kaydetme), yorumlar.
- **Yazma**: yorum yanıtlama, içerik yayınlama (content publishing — Reels/görsel).

Her iki entegrasyon da `src/lib/platforms/` altında ortak bir arayüzü
(`PlatformClient`) uygular; böylece ileride TikTok vb. eklemek kolay olur.

```ts
interface PlatformClient {
  getPosts(): Promise<Post[]>;          // videolar / medyalar
  getMetrics(postId): Promise<Metric>;  // anlık metrikler
  getComments(postId): Promise<Comment[]>;
  replyToComment(commentId, text): Promise<void>;
  publishPost(draft): Promise<string>;  // planlı paylaşım yayını
}
```

## 4. Veri Modeli (Prisma)

- **Account** — bağlı platform hesabı (platform, hesap adı, OAuth token'ları, durum)
- **Post** — platformdaki içerik (başlık, açıklama, yayın tarihi, kalıcı bağlantı)
- **MetricSnapshot** — bir içeriğin belirli andaki metrikleri (izlenme, beğeni,
  yorum, paylaşım, kaydetme). Periyodik toplanır → zaman serisi grafikleri buradan çizilir.
- **Comment** — gelen yorum (yazar, metin, tarih, yanıtlandı mı, duygu etiketi)
- **ScheduledPost** — planlı paylaşım (hedef hesap, içerik, medya yolu, planlanan
  zaman, durum: taslak / planlandı / yayınlandı / hata)
- **Insight** — üretilen büyüme önerisi (tür, başlık, açıklama, dayandığı veri)

## 5. Sayfalar

| Rota | İçerik |
|---|---|
| `/` | Genel bakış: toplam metrikler, son 30 gün trendi, bekleyen yorumlar, yaklaşan paylaşımlar |
| `/analytics` | İçerik bazlı detaylı analiz, zaman serisi grafikleri, içerik karşılaştırma |
| `/comments` | Gelen kutusu: tüm platformlardan yorumlar, filtreleme, yanıtlama |
| `/planner` | Takvim görünümü, yeni paylaşım planlama, taslaklar |
| `/insights` | Büyüme önerileri (en iyi saat, içerik türü performansı, başlık analizi) |
| `/accounts` | Hesap bağlama (OAuth), bağlantı durumu, kota görünümü |

## 6. Arka Plan İşleri

`/api/cron` rotası dış bir zamanlayıcıyla (sunucu cron'u, Vercel Cron, vb.)
periyodik çağrılır ve sırayla:

1. **Metrik toplama** (örn. saatte bir): tüm bağlı hesapların içerik metriklerini
   çekip `MetricSnapshot` olarak kaydeder.
2. **Yorum senkronu**: yeni yorumları çekip gelen kutusuna ekler.
3. **Planlı yayın**: zamanı gelmiş `ScheduledPost` kayıtlarını yayınlar.
4. **Öneri üretimi** (günde bir): birikmiş veriden kural tabanlı öneriler çıkarır
   (Faz 4'te Claude API destekli hale gelir).

## 7. Yol Haritası

- **Faz 1 — İskelet (bu aşama)**: Proje yapısı, veri modeli, sayfa düzeni,
  platform istemci arayüzleri (sahte/örnek veriyle çalışan demo modu).
- **Faz 2 — YouTube entegrasyonu**: Google OAuth, gerçek metrik/yorum senkronu,
  yorum yanıtlama.
- **Faz 3 — Instagram entegrasyonu**: Meta OAuth, insights, yorumlar, content publishing.
- **Faz 4 — AI katmanı**: Claude API ile yorum yanıt taslakları, içerik fikirleri,
  doğal dilde büyüme önerileri.
- **Faz 5 — Planlayıcının otomasyonu**: medya yükleme, otomatik yayın, hata bildirimleri.

## 8. Yapılandırma

Gizli bilgiler `.env` dosyasında tutulur (depoya girmez):

```
DATABASE_URL="file:./dev.db"
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
META_APP_ID=...
META_APP_SECRET=...
CRON_SECRET=...          # /api/cron rotasını korur
# ANTHROPIC_API_KEY=...  # Faz 4'te
```

Demo modu: hiçbir API anahtarı tanımlı değilse uygulama örnek veriyle çalışır,
böylece arayüz geliştirmesi hesap bağlamadan yapılabilir.

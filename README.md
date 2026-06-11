# Sosyal Medya Yönetim Paneli

Instagram ve YouTube hesaplarını tek panelden yönetmek için web uygulaması:
içerik analizi, büyüme önerileri, yorum etkileşimi ve paylaşım planlama.

Detaylı mimari ve yol haritası için [DESIGN.md](./DESIGN.md) dosyasına bakın.

## Kurulum

```bash
npm install
cp .env.example .env        # değerleri doldurun (demo için DATABASE_URL yeterli)
npm run db:push             # SQLite veritabanını oluşturur
npm run db:seed             # demo verisini yükler
npm run dev                 # http://localhost:3000
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run db:push` | Prisma şemasını veritabanına uygular |
| `npm run db:seed` | Demo verisini yükler |
| `npm run lint` | ESLint kontrolü |

## Sayfalar

- **Genel Bakış** (`/`) — toplam metrikler, en iyi içerikler, yaklaşan paylaşımlar
- **Analiz** (`/analytics`) — içerik bazlı metrikler ve 7 günlük değişim
- **Yorumlar** (`/comments`) — gelen kutusu, yanıt bekleyenler, yanıtlama
- **Planlayıcı** (`/planner`) — paylaşım planlama ve durum takibi
- **Öneriler** (`/insights`) — veriye dayalı büyüme önerileri
- **Hesaplar** (`/accounts`) — bağlı hesaplar ve bağlantı durumu

## Durum

Şu an **Faz 1 (iskelet)** tamamlandı: veri modeli, tüm sayfalar ve demo modu
çalışıyor. YouTube (Faz 2) ve Instagram (Faz 3) gerçek API entegrasyonları ile
AI destekli öneriler (Faz 4) yol haritasında.

# Ücretsiz Sunucuya Kurulum (Vercel + Neon)

Uygulama, **Vercel Hobby** (ücretsiz) üzerinde çalışır ve veritabanı olarak
**Neon** (ücretsiz PostgreSQL) kullanır. İkisi de kredi kartı istemez.

## 1. Neon — ücretsiz PostgreSQL

1. **neon.tech** → **Sign up** (GitHub hesabınla girebilirsin).
2. **Create project** → ad ver (örn. `socialmedia`), bölge olarak Avrupa
   (örn. Frankfurt) seç → **Create**.
3. Açılan panodaki **Connection string** kutusundan `postgresql://...` ile
   başlayan bağlantı adresini kopyala. Bu senin `DATABASE_URL` değerin.

## 2. Vercel — uygulama sunucusu

1. **vercel.com** → **Sign up** → **Continue with GitHub**.
2. **Add New → Project** → GitHub deposunu (`sohbethub/socialmedia`) seç →
   **Import**. (Depo görünmüyorsa "Adjust GitHub App Permissions" ile erişim ver.)
3. **Environment Variables** bölümüne şunları ekle:

   | Ad | Değer |
   |---|---|
   | `DATABASE_URL` | Neon'dan kopyaladığın bağlantı adresi |
   | `GOOGLE_CLIENT_ID` | Google Cloud Console'daki OAuth istemci kimliği |
   | `GOOGLE_CLIENT_SECRET` | OAuth istemci sırrı |
   | `CRON_SECRET` | Rastgele uzun bir dize (örn. `openssl rand -hex 24` çıktısı) |

4. **Deploy** → bittiğinde `https://<proje-adi>.vercel.app` adresin hazır.

## 3. Veritabanı şemasını yükle

Kendi bilgisayarında, depo klasöründe:

```bash
# .env dosyasındaki DATABASE_URL'i Neon adresiyle değiştir, sonra:
npm run db:push     # tabloları oluşturur
npm run db:seed     # (isteğe bağlı) demo verisini yükler
```

## 4. Google OAuth yönlendirme adresini güncelle

Google Cloud Console → **APIs & Services → Credentials** → OAuth istemcine
tıkla → **Authorized redirect URIs** listesine ekle:

```
https://<proje-adi>.vercel.app/api/auth/google/callback
```

Bunu eklemeden canlı sitede "YouTube kanalını bağla" düğmesi
`redirect_uri_mismatch` hatası verir.

## 5. Periyodik senkron (cron)

- `vercel.json` içindeki tanım sayesinde Vercel, `/api/cron` rotasını **günde
  bir** (03:00 UTC) otomatik çağırır ve `CRON_SECRET` tanımlıysa isteğe doğru
  Authorization başlığını kendisi ekler. Hobby planın sınırı günde bir çalıştırmadır.
- Daha sık senkron istersen (örn. saatte bir) ücretsiz **cron-job.org**'a üye
  olup şu isteği zamanla:
  - URL: `https://<proje-adi>.vercel.app/api/cron`
  - Header: `Authorization: Bearer <CRON_SECRET>`
- Ayrıca paneldeki **Hesaplar → "Şimdi senkronize et"** düğmesiyle istediğin an
  elle tetikleyebilirsin.

## Notlar / sınırlar

- **Vercel Hobby**: kişisel kullanım için ücretsizdir; sunucusuz fonksiyon
  süresi sınırlıdır (varsayılan 10 sn, ayarla 60 sn'ye çıkar). Çok videolu
  kanallarda ilk senkron uzun sürerse `vercel.json`'a fonksiyon süresi ayarı
  ekleriz.
- **Neon ücretsiz plan**: 0,5 GB depolama — metrik anlık görüntüleri için
  uzun süre fazlasıyla yeterli.
- Video **yükleme** (Faz 5) gibi büyük dosyalı işler için ileride farklı bir
  çözüm gerekebilir; analiz/yorum/planlama akışları bu kurulumla tam çalışır.

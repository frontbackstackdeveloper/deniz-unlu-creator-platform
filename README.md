# Deniz Ünlü — Metin2 Yayın ve Video Arşivi

Deniz Ünlü'nün güncel yayın bağlantılarını, YouTube videolarını, Dailymotion
arşivini, aktif Metin2 sunucularını, çekilişlerini ve topluluk panosunu tek
merkezde sunan web sitesi.

## Başlıca bölümler

- Güncel YouTube kanalından otomatik video akışı
- Dailymotion profilinden otomatik yayın arşivi
- Kick, Discord, WhatsApp ve diğer yönetilebilir bağlantılar
- Yönetim panelinden sunucu, bağlantı ve canlı yayın yönetimi
- 50 katılımcıda otomatik sonuçlanan çekiliş sistemi
- Üyeliksiz, dil filtreli ve yönetici tarafından düzenlenebilir topluluk panosu

## Yerel geliştirme

Node.js `22.13.0` veya daha yeni bir sürüm gerekir.

```bash
npm install
npm run dev
```

Yerel adres: `http://localhost:3000`

Üretim derlemesini ve uygulama testlerini çalıştırmak için:

```bash
npm test
```

## Ortam ayarları

Gerekli değişkenlerin açıklamaları `.env.example` dosyasında bulunur. Yönetici
e-postası, site adresi ve Cloudflare Turnstile anahtarları yayın ortamında ayrıca
tanımlanmalıdır.

## Veri yapısı

Yönetilebilir site içeriği, çekiliş katılımları ve topluluk mesajları Cloudflare
D1 üzerinde saklanır. Video dosyaları siteye yüklenmez; güncel videolar YouTube,
arşiv videoları Dailymotion üzerinden gösterilir.

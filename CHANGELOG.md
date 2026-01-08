# EduPlan - Ders Programı Yönetim Sistemi

Modern üniversite ders programı yönetim ve otomasyon sistemi.

## 🚀 Yeni Özellikler ve İyileştirmeler

### Güvenlik İyileştirmeleri ✅

#### 1. SQL Injection Koruması
- ✅ Parameterized queries kullanımı
- ✅ Tüm IN clause'lar güvenli hale getirildi
- ✅ `turso-helpers.ts` dosyasındaki tüm dinamik sorgular düzeltildi

#### 2. Request Validation
- ✅ Zod validation şeması implementasyonu
- ✅ API route'larında otomatik veri doğrulama
- ✅ Tip güvenli input handling

#### 3. Error Boundary
- ✅ React Error Boundary component'i eklendi
- ✅ Graceful error handling
- ✅ Kullanıcı dostu hata mesajları

### Performans İyileştirmeleri ✅

#### 4. Memory Cache Sistemi
- ✅ In-memory caching implementasyonu
- ✅ TTL (time-to-live) desteği
- ✅ Pattern-based cache invalidation
- ✅ API route'larına entegrasyon

#### 5. Structured Logging
- ✅ Winston logger entegrasyonu
- ✅ Seviyeli logging (error, warn, info, debug)
- ✅ File ve console transport'ları
- ✅ Scheduler ve API event tracking

### Test & Deployment ✅

#### 6. Test Suite
- ✅ Vitest konfigürasyonu
- ✅ React Testing Library setup
- ✅ Coverage reporting
- ✅ Örnek cache testleri

#### 7. Docker Support
- ✅ Multi-stage Dockerfile
- ✅ Docker Compose konfigürasyonu
- ✅ Production-ready image
- ✅ Health check endpoint

#### 8. CI/CD Pipeline
- ✅ GitHub Actions workflows
- ✅ Otomatik test çalıştırma
- ✅ Build doğrulama
- ✅ Security audit

## 📋 Gereksinimler

- Node.js 20.x veya üzeri
- npm veya yarn
- PostgreSQL/Turso Database

## 🛠️ Kurulum

### Lokal Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Veritabanını hazırla
npx prisma generate
npx prisma migrate dev

# Geliştirme sunucusunu başlat
npm run dev
```

### Docker ile Çalıştırma

```bash
# Docker Compose ile başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Durdur
docker-compose down
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Test UI ile
npm run test:ui

# Coverage raporu
npm run test:coverage
```

## 📝 Environment Variables

`.env.local` dosyası oluşturun:

```env
# JWT Secret
JWT_SECRET=your-secret-key-here

# Database (Turso)
TURSO_DATABASE_URL=your-turso-url
TURSO_AUTH_TOKEN=your-auth-token

# Or PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/eduplan

# Node Environment
NODE_ENV=development
```

## 📁 Proje Yapısı

```
eduplan/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── (dashboard)/  # Dashboard pages
│   │   └── login/        # Auth pages
│   ├── components/       # React Components
│   │   ├── ui/           # UI Components
│   │   └── error-boundary.tsx
│   ├── lib/              # Utility libraries
│   │   ├── cache.ts      # Memory cache
│   │   ├── logger.ts     # Winston logger
│   │   ├── schemas.ts    # Zod validation
│   │   └── turso-helpers.ts
│   └── test/             # Test files
├── prisma/               # Database schema
├── .github/workflows/    # CI/CD
├── Dockerfile
├── docker-compose.yml
└── vitest.config.ts
```

## 🔒 Güvenlik

- ✅ Parameterized SQL queries
- ✅ Input validation (Zod)
- ✅ JWT authentication
- ✅ CSRF protection
- ✅ Rate limiting (TODO)

## 📊 Logging

Loglar `logs/` dizininde saklanır:

- `error.log` - Sadece hatalar
- `combined.log` - Tüm loglar

Örnek log sorguları:

```bash
# Son hataları göster
tail -f logs/error.log

# Scheduler eventlerini filtrele
cat logs/combined.log | grep "Scheduler Event"
```

## 🚀 Deployment

### Docker ile Production

```bash
# Image oluştur
docker build -t eduplan:latest .

# Çalıştır
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e TURSO_DATABASE_URL=your-url \
  -e TURSO_AUTH_TOKEN=your-token \
  eduplan:latest
```

### Vercel/Netlify

1. Repository'yi bağlayın
2. Environment variables'ı ayarlayın
3. Build command: `npm run build`
4. Output directory: `.next`

## 📈 Gelecek İyileştirmeler

### Yüksek Öncelik
- [ ] Scheduler algoritması iyileştirmesi (Simulated Annealing/Constraint Programming)
- [ ] Rate limiting middleware
- [ ] API request/response logging middleware

### Orta Öncelik
- [ ] Redis cache entegrasyonu
- [ ] WebSocket desteği (real-time updates)
- [ ] Email bildirim sistemi
- [ ] Advanced analytics dashboard

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 İletişim

Sorularınız için:
- GitHub Issues
- Email: support@eduplan.com

---

**Not**: Bu README, 2026-01-08 tarihinde yapılan kapsamlı güvenlik ve performans iyileştirmeleri sonrası güncellenmiştir.

# PlanEdu - Ders Programi Yonetim Sistemi

Modern, kullanici dostu ve yapay zeka destekli bir universite ders programi yonetim sistemi.

**Full-Stack Next.js + TypeScript + Prisma**

## Ozellikler

- **Akıllı Sezgisel Algoritma (Smart Greedy Heuristic)** ile otomatik program olusturma
- Fakulte, bolum, ogretmen, ders ve sinif yonetimi
- Rol tabanli yetkilendirme (Admin/Kullanici)
- Modern, responsive arayuz
- SQLite veritabani (Prisma ORM)
- JWT tabanli kimlik dogrulama

## Teknoloji Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **React 19**
- **Tailwind CSS**
- **shadcn/ui** components
- **Lucide React** icons

### Backend (Next.js API Routes)
- **Prisma ORM** (SQLite)
- **JWT** authentication
- **bcryptjs** password hashing

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adimlar

```bash
# Bagimliliklari yukle
npm install

# Veritabanini olustur
npx prisma migrate dev

# Gelistirme sunucusunu baslat
npm run dev
```

Tarayicinizda [http://localhost:3000](http://localhost:3000) adresini acin.

## Proje Yapisi

```
src/
├── app/
│   ├── api/                # Backend API Routes
│   │   ├── auth/           # Kimlik dogrulama
│   │   ├── teachers/       # Ogretmen API
│   │   ├── courses/        # Ders API
│   │   ├── classrooms/     # Derslik API
│   │   ├── schedules/      # Program API
│   │   ├── scheduler/      # Program olusturucu API
│   │   └── statistics/     # Istatistik API
│   ├── (dashboard)/        # Dashboard sayfalari
│   └── login/              # Giris sayfasi
├── components/
│   ├── ui/                 # shadcn/ui bilesenler
│   ├── layout/             # Sidebar, Header
│   └── [feature]/          # Ozellik bazli bilesenler
├── contexts/               # React Context
├── hooks/                  # Custom hooks
├── lib/                    # Prisma, Auth, Utils
├── types/                  # TypeScript tipleri
└── constants/              # Sabit veriler
prisma/
├── schema.prisma           # Veritabani semasi
└── migrations/             # Veritabani migrationlari
```

## Demo Kullanicilar

Ilk giris denemesinde otomatik olusturulur:

| Rol       | Kullanici Adi | Sifre      |
|-----------|---------------|------------|
| Yonetici  | admin         | admin123   |
| Ogretmen  | teacher       | teacher123 |

## API Endpoints

| Endpoint | Method | Aciklama |
|----------|--------|----------|
| `/api/auth/login` | POST | Giris |
| `/api/auth/me` | GET | Mevcut kullanici |
| `/api/teachers` | GET, POST | Ogretmenler |
| `/api/teachers/[id]` | GET, PUT, DELETE | Ogretmen detay |
| `/api/courses` | GET, POST | Dersler |
| `/api/courses/[id]` | GET, PUT, DELETE | Ders detay |
| `/api/classrooms` | GET, POST | Derslikler |
| `/api/classrooms/[id]` | GET, PUT, DELETE | Derslik detay |
| `/api/schedules` | GET, POST | Programlar |
| `/api/schedules/[id]` | DELETE | Program sil |
| `/api/schedules/days/delete` | POST | Gunlere gore sil |
| `/api/scheduler/generate` | POST | Program olustur |
| `/api/scheduler/status` | GET | Durum |
| `/api/statistics` | GET | Istatistikler |

## Lisans

Apache 2.0

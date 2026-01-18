# Migration Guide - v2.0.0

Bu dokümant, mevcut EduPlan projesini yeni mimari yapıya migrate etme adımlarını içerir.

## 🚨 Önemli Notlar

- Bu migration **database schema değişiklikleri** içerir
- Production'da çalıştırmadan önce **backup alın**
- Migration sırasında uygulamayı **maintenance mode**'a alın
- Test ortamında önce deneyin

---

## 📋 Migration Adımları

### 1. Bağımlılıkları Yükle

```bash
# React Query ve DevTools
npm install @tanstack/react-query@latest
npm install @tanstack/react-query-devtools@latest

# Doğrulama (Already installed, but verify version)
npm list @tanstack/react-query
```

### 2. Database Migration

#### 2.1 Migration Dosyası Oluştur

```bash
# Development ortamında:
npx prisma migrate dev --name add_performance_indexes

# Çıktı:
# ✔ Generated Prisma Client
# ✔ Applied migration add_performance_indexes
```

#### 2.2 Migration İçeriği

Migration otomatik oluşturuldu, ancak manuel kontrol edin:

```sql
-- CreateIndex
CREATE INDEX "Teacher_faculty_department_idx" ON "Teacher"("faculty", "department");
CREATE INDEX "Teacher_isActive_idx" ON "Teacher"("isActive");

-- CreateIndex  
CREATE INDEX "Course_faculty_level_idx" ON "Course"("faculty", "level");
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");
CREATE INDEX "Course_teacherId_idx" ON "Course"("teacherId");
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- CreateIndex
CREATE INDEX "Classroom_faculty_department_idx" ON "Classroom"("faculty", "department");
CREATE INDEX "Classroom_type_idx" ON "Classroom"("type");
CREATE INDEX "Classroom_isActive_idx" ON "Classroom"("isActive");

-- CreateIndex
CREATE INDEX "Schedule_day_timeRange_idx" ON "Schedule"("day", "timeRange");
CREATE INDEX "Schedule_courseId_classroomId_idx" ON "Schedule"("courseId", "classroomId");
CREATE INDEX "Schedule_isHardcoded_idx" ON "Schedule"("isHardcoded");
CREATE INDEX "Schedule_day_idx" ON "Schedule"("day");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_category_idx" ON "Notification"("category");
```

#### 2.3 Production'da Uygula

```bash
# Production database'e bağlan
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Veya Turso için:
TURSO_DATABASE_URL="your-turso-url" \
TURSO_AUTH_TOKEN="your-token" \
npx prisma migrate deploy
```

### 3. Prisma Client Yenile

```bash
# Client'ı yeniden oluştur
npx prisma generate

# Verify
npm run build
```

---

## 🔄 Kod Değişiklikleri

### 3.1 Layout Güncelleme

`src/app/layout.tsx` zaten güncellendi, ancak kontrol edin:

```tsx
import { QueryProvider } from "@/contexts/query-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <QueryProvider>  {/* YENİ */}
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3.2 Component Güncellemeleri

Tüm component'lerde hook kullanımı güncellendi:

#### Courses Page

```diff
// src/app/(dashboard)/courses/page.tsx
- import { useCourses } from '@/hooks/use-courses';
+ import { useCourses, useDeleteCourse } from '@/hooks/use-courses';

export default function CoursesPage() {
-  const { courses, isLoading, deleteCourse } = useCourses();
+  const { data: courses = [], isLoading } = useCourses();
+  const { mutate: deleteCourse } = useDeleteCourse();
}
```

#### Teachers Page

```diff
// src/app/(dashboard)/teachers/page.tsx
- import { useTeachers } from '@/hooks/use-teachers';
+ import { useTeachers, useDeleteTeacher } from '@/hooks/use-teachers';

export default function TeachersPage() {
-  const { teachers, isLoading, deleteTeacher } = useTeachers();
+  const { data: teachers = [], isLoading } = useTeachers();
+  const { mutate: deleteTeacher } = useDeleteTeacher();
}
```

#### Classrooms Page

```diff
// src/app/(dashboard)/classrooms/page.tsx
- import { useClassrooms } from '@/hooks/use-classrooms';
+ import { useClassrooms, useDeleteClassroom } from '@/hooks/use-classrooms';

export default function ClassroomsPage() {
-  const { classrooms, isLoading, deleteClassroom } = useClassrooms();
+  const { data: classrooms = [], isLoading } = useClassrooms();
+  const { mutate: deleteClassroom } = useDeleteClassroom();
}
```

### 3.3 API Routes Güncelleme (Opsiyonel)

Mevcut API route'lar yeni yapıya uygun hale getirildi. Eğer custom route'larınız varsa:

```typescript
// Eski yapı
export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const body = await request.json();
  const result = await someOperation(body);
  return NextResponse.json(result);
}

// Yeni yapı
import { withAdminAndValidation } from '@/middleware';
import { SomeSchema } from '@/lib/schemas';

export const POST = withAdminAndValidation(
  SomeSchema,
  async (request, user, validated) => {
    const result = await someOperation(validated);
    return NextResponse.json(result);
  }
);
```

---

## 🧪 Testing

### 4.1 Manuel Test Checklist

- [ ] Login işlemi çalışıyor
- [ ] Courses list yükleniyor
- [ ] Yeni ders eklenebiliyor
- [ ] Ders güncellenebiliyor
- [ ] Ders silinebiliyor
- [ ] Teachers list yükleniyor
- [ ] Öğretmen eklenebiliyor
- [ ] Öğretmen güncellenebiliyor
- [ ] Öğretmen silinebiliyor
- [ ] Classrooms list yükleniyor
- [ ] Derslik eklenebiliyor
- [ ] Derslik güncellenebiliyor
- [ ] Derslik silinebiliyor
- [ ] Filtreleme çalışıyor
- [ ] Arama çalışıyor
- [ ] Scheduler çalışıyor

### 4.2 Performance Test

```bash
# Development ortamında React Query DevTools'u açın
# Browser'da: http://localhost:3000
# Sağ altta React Query DevTools butonu görünecek

# Cache'i test edin:
# 1. Bir sayfayı yükleyin
# 2. Başka sayfaya gidin
# 3. Geri dönün - cache'den yüklenmeli (anında)

# Network tab'ı açın:
# 1. Network -> Fetch/XHR filtresi
# 2. Sayfa yüklemelerini gözlemleyin
# 3. Gereksiz request olmamalı
```

---

## 🔍 Troubleshooting

### Problem: "Cannot find module '@tanstack/react-query'"

```bash
# Çözüm:
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Prisma Client validation error"

```bash
# Çözüm:
npx prisma generate
npm run build
```

### Problem: "Query key must be an array"

```typescript
// YANLIŞ:
useQuery({ queryKey: 'courses', ... })

// DOĞRU:
useQuery({ queryKey: ['courses'], ... })
```

### Problem: Component "courses is undefined"

```typescript
// YANLIŞ:
const { data: courses } = useCourses();
console.log(courses.length); // Error if data is undefined

// DOĞRU:
const { data: courses = [] } = useCourses();
console.log(courses.length); // Safe
```

### Problem: Mutation çalışmıyor

```typescript
// YANLIŞ:
const deleteMutation = useDeleteCourse();
deleteMutation(id); // Çalışmaz

// DOĞRU:
const { mutate: deleteCourse } = useDeleteCourse();
deleteCourse(id); // Çalışır
```

---

## 📊 Rollback Plan

Eğer migration sırasında sorun olursa:

### 1. Database Rollback

```bash
# Son migration'ı geri al
npx prisma migrate resolve --rolled-back "migration_name"

# Veya tüm pending migration'ları geri al
npx prisma migrate reset
```

### 2. Code Rollback

```bash
# Git ile önceki versiyona dön
git revert HEAD
# veya
git checkout <previous-commit-hash>
```

### 3. Dependencies Rollback

```bash
# package.json'dan React Query'i kaldır
npm uninstall @tanstack/react-query @tanstack/react-query-devtools

# Eski dependencies'i yükle
npm install
```

---

## ✅ Post-Migration Checklist

Migration tamamlandıktan sonra:

- [ ] Tüm testler geçiyor
- [ ] Production'da sorunsuz çalışıyor
- [ ] Performance metrikleri iyileşti
- [ ] Hata logları temiz
- [ ] Kullanıcı feedback'i olumlu
- [ ] Dokümantasyon güncellendi
- [ ] Team'e bilgi verildi

---

## 📞 Destek

Sorun yaşarsanız:

1. `REFACTORING.md` dosyasını okuyun
2. Console error'larını kontrol edin
3. React Query DevTools'u kullanın
4. Team'den destek isteyin

---

**Son Güncelleme:** 18 Ocak 2026  
**Migration Versiyonu:** 1.0.0 → 2.0.0

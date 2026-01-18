# Bug Fixes - Zod Refinement & Type Issues

## 🐛 Hatalar ve Çözümleri

### Hata 1: `.partial() cannot be used on object schemas containing refinements`

**Sorun:**
```typescript
export const CreateCourseSchema = z.object({...}).refine(...);
export const UpdateCourseSchema = CreateCourseSchema.partial(); // ❌ Hata!
```

Zod'da `.refine()` içeren bir schema üzerinde `.partial()` kullanılamaz.

**Çözüm:**
Base schema oluştur ve refinement'ı sadece Create schema'ya ekle:

```typescript
// Base schema (refinement olmadan)
const BaseCourseSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().regex(/^[A-Z]{2,4}\d{3,4}$/),
  // ... diğer alanlar
});

// Create schema (refinement ile)
export const CreateCourseSchema = BaseCourseSchema.refine(
  (data) => {
    const totalHours = data.sessions.reduce((sum, s) => sum + s.hours, 0);
    return totalHours === data.total_hours;
  },
  { message: 'Oturum saatleri toplamı total_hours ile eşleşmelidir' }
);

// Update schema (partial, refinement olmadan)
export const UpdateCourseSchema = BaseCourseSchema.partial(); // ✅ Çalışır!
```

**Düzeltilen Dosyalar:**
- `src/lib/schemas.ts` - Course schemas
- `src/lib/schemas.ts` - Teacher schemas (working_hours refinement)

---

### Hata 2: `teacher_id` Type Mismatch

**Sorun:**
```typescript
// Type definition
interface Course {
  teacher_id: number; // ❌ null olamıyor
}

// Actual usage
const course = {
  teacher_id: null, // null değer gönderi liyor
};
```

**Çözüm:**
`teacher_id`'yi nullable yap:

```typescript
// src/types/index.ts
export interface Course {
  teacher_id: number | null; // ✅ Null olabilir
}

export interface CourseCreate {
  teacher_id: number | null; // ✅ Null olabilir
}

// src/lib/schemas.ts
const BaseCourseSchema = z.object({
  teacher_id: z.number().positive().nullable().optional(), // ✅ Zod'da da nullable
});
```

**Düzeltilen Dosyalar:**
- `src/types/index.ts` - Course interface
- `src/types/index.ts` - CourseCreate interface
- `src/lib/schemas.ts` - Zod schema (zaten nullable'dı)

---

## ✅ Test Checklist

Düzeltmeleri test etmek için:

### 1. Dev Server'ı Yeniden Başlat

```bash
# Terminal'de Ctrl+C ile durdur
npm run dev
```

### 2. Teachers Page Test

- [ ] `/teachers` sayfasına git
- [ ] Liste yükleniyor mu?
- [ ] Yeni öğretmen ekle
- [ ] Öğretmen düzenle

### 3. Courses Page Test

- [ ] `/courses` sayfasına git
- [ ] Liste yükleniyor mu?
- [ ] Öğretmensiz ders oluştur (teacher_id: null)
- [ ] Ders düzenle
- [ ] Bulk edit sayfasını test et

### 4. Build Test

```bash
# Dev server'ı durdur
npm run build
```

Hata almadan build olmalı.

---

## 🔍 Neden Bu Hatalar Oluştu?

### 1. Refinement Hatası

Refactoring sırasında Zod validation'larını güçlendirdik ve `.refine()` ekledik. Ancak Zod'un bir kısıtlaması var: refinement içeren schema'lar üzerinde `.partial()` çalışmaz.

**Çözüm Stratejisi:**
- Base schema oluştur (refinement olmadan)
- Create için refinement ekle
- Update için base schema'dan partial oluştur

### 2. Type Mismatch

Orijinal kodda `teacher_id` bazen null olabiliyordu ama type definition'da bu belirtilmemişti. Bu implicit behavior'du ve TypeScript strict mode'da yakalandı.

**Çözüm Stratejisi:**
- Type'ları gerçek kullanımla eşleştir
- Nullable alanları açıkça işaretle
- Zod schema ile TypeScript type'ları senkronize tut

---

## 📚 Best Practices

### Zod Schemas ile Çalışırken

#### ✅ DO:

```typescript
// Base schema oluştur
const BaseSchema = z.object({...});

// Refinement varsa, ayrı schema'da ekle
const CreateSchema = BaseSchema.refine(...);

// Update için base'den partial oluştur
const UpdateSchema = BaseSchema.partial();
```

#### ❌ DON'T:

```typescript
// Refinement'lı schema'dan partial oluşturma
const CreateSchema = z.object({...}).refine(...);
const UpdateSchema = CreateSchema.partial(); // Hata verir!
```

### Nullable Fields

#### ✅ DO:

```typescript
// Type ve schema'da tutarlı nullable
interface MyType {
  field: number | null;
}

const MySchema = z.object({
  field: z.number().nullable().optional(),
});
```

#### ❌ DON'T:

```typescript
// Type'da nullable değil ama gerçekte null olabiliyor
interface MyType {
  field: number; // ❌ Yanıltıcı
}

const actual = { field: null }; // Gerçekte null
```

---

## 🔄 Alternatif Çözümler

### Refinement için Alternatif 1: Superrefine

```typescript
const UpdateCourseSchema = BaseCourseSchema.partial().superRefine((data, ctx) => {
  if (data.sessions && data.total_hours) {
    const totalHours = data.sessions.reduce((sum, s) => sum + s.hours, 0);
    if (totalHours !== data.total_hours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Oturum saatleri toplamı eşleşmiyor',
        path: ['sessions'],
      });
    }
  }
});
```

**Avantaj:** Partial schema'da da validation yapılabilir  
**Dezavantaj:** Daha verbose

### Refinement için Alternatif 2: Manuel Validation

```typescript
// Schema'da refinement yok
const UpdateCourseSchema = BaseCourseSchema.partial();

// Service layer'da manuel kontrol
async updateCourse(id: number, data: UpdateCourseInput) {
  if (data.sessions && data.total_hours) {
    const totalHours = data.sessions.reduce((sum, s) => sum + s.hours, 0);
    if (totalHours !== data.total_hours) {
      throw new Error('Oturum saatleri toplamı eşleşmiyor');
    }
  }
  // ... update logic
}
```

**Avantaj:** Daha esnek, business logic'te kontrol  
**Dezavantaj:** Validation logic dağıtılmış

---

## 📝 Notlar

- Source map uyarıları (`Invalid source map`) normal ve zararsızdır. Turbopack development özelliği.
- Build yaparken dev server'ı durdurun (Prisma lock problemi)
- Hot reload çalışıyor, değişiklikler otomatik yansıyacak

---

**Düzeltme Tarihi:** 18 Ocak 2026  
**Düzeltilen Hatalar:** 2  
**Etkilenen Dosyalar:** 2

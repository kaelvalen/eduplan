# Gelişmiş Scheduler Özellikleri

Bu dokümantasyon, PlanEdu scheduler sisteminin gelişmiş özelliklerini açıklar.

## 📋 İçindekiler

1. [Adaptif Konfigürasyon](#adaptif-konfigürasyon)
2. [Simulated Annealing](#simulated-annealing)
3. [Parametre Öğrenme Sistemi](#parametre-öğrenme-sistemi)
4. [Paralel Zamanlama](#paralel-zamanlama)
5. [Kullanım Örnekleri](#kullanım-örnekleri)

---

## 🔧 Adaptif Konfigürasyon

Adaptif konfigürasyon sistemi, problem karakteristiklerine göre scheduler parametrelerini otomatik olarak ayarlar.

### Özellikler

- **Otomatik Timeout Hesaplama**: Ders ve derslik sayısına göre dinamik timeout
- **Zorluk Ağırlıkları**: Derslik kıtlığı ve öğrenci sayısına göre adaptif ağırlıklar
- **Kapasite Kısıtları**: Runtime metriklerine göre kapasite kullanımı optimizasyonu
- **Hill Climbing Parametreleri**: Başarı oranına göre iterasyon sayısı ayarı

### Nasıl Çalışır?

```typescript
// Otomatik olarak etkinleştirilir (varsayılan)
const config: SchedulerConfig = {
  courses,
  classrooms,
  timeBlocks,
  features: {
    enableAdaptiveConfig: true, // Varsayılan: true
  },
};
```

### Adaptasyon Kriterleri

| Durum | Adaptasyon |
|-------|-----------|
| Derslik kullanımı > 90% | Derslik kıtlığı ağırlığı x1.5 |
| Derslik kullanımı < 50% | Derslik kıtlığı ağırlığı x0.7 |
| Ortalama sınıf > 100 öğrenci | Öğrenci ağırlığı x1.3 |
| Ortalama oturum > 3 saat | Süre ağırlığı x1.5 |
| Lab dersleri var | Timeout x1.3 |

### Örnek Çıktı

```
🔧 Adaptive Configuration Applied:
  Problem: 45 courses, 12 classrooms
  Classroom utilization: 87.3%
  Classroom scarcity weight: 5 → 7.50
  Timeout: 60000ms → 82500ms
```

---

## 🔥 Simulated Annealing

Simulated annealing, lokal optimumlardan kaçmak için kötü çözümleri de kabul edebilen gelişmiş bir optimizasyon tekniğidir.

### Ne Zaman Kullanılır?

- Kalite hızdan daha önemliyse
- Karmaşık kısıtlar varsa
- Hill climbing yeterli değilse

### Konfigürasyon

```typescript
const config: SchedulerConfig = {
  courses,
  classrooms,
  timeBlocks,
  features: {
    enableSimulatedAnnealing: true, // Varsayılan: false
  },
};
```

### Parametreler

```typescript
// config.ts içinde
simulatedAnnealing: {
  initialTemperature: 100,  // Başlangıç sıcaklığı
  coolingRate: 0.95,        // Soğuma hızı (0-1)
  minTemperature: 0.1,      // Minimum sıcaklık
  maxIterations: 50,        // Sıcaklık başına iterasyon
}
```

### Performans

- **Süre**: Hill climbing'e göre ~2-3x daha yavaş
- **Kalite**: %5-15 daha iyi soft constraint skoru
- **Kullanım**: Kalite odaklı senaryolar için önerilir

### Örnek Çıktı

```
🔥 Starting Simulated Annealing
   Initial energy: 245.30
🔥 Simulated Annealing Complete
   Final energy: 198.45 (improved by 46.85)
   Total iterations: 2500
   Accepted moves: 847 (33.9%)
   Improvements: 234
```

---

## 🎓 Parametre Öğrenme Sistemi

Geçmiş zamanlama denemelerinden öğrenerek optimal parametreleri otomatik olarak bulur.

### Özellikler

- **Otomatik Kayıt**: Her zamanlama denemesi kaydedilir
- **Benzer Problem Tespiti**: Benzer problemler için öğrenilen parametreler kullanılır
- **Sürekli İyileşme**: Her denemeden öğrenir

### Kullanım

```typescript
const config: SchedulerConfig = {
  courses,
  classrooms,
  timeBlocks,
  features: {
    enableLearning: true, // Varsayılan: true
  },
};
```

### Öğrenilen Parametreler

- Zorluk formülü katsayıları (studentWeight, classroomScarcity, sessionDuration)
- Hill climbing iterasyon sayısı
- Acceptance rate

### Veri Yönetimi

```typescript
import { 
  getLearningStats, 
  getLearningDatabase,
  clearLearningData 
} from '@/lib/scheduler/learning-system';

// İstatistikleri görüntüle
const stats = getLearningStats();
console.log(stats);
// {
//   totalRecords: 45,
//   avgSuccessRate: 0.923,
//   bestSuccessRate: 1.0,
//   avgDuration: 12450
// }

// Verileri dışa aktar
const db = getLearningDatabase();
const json = db.exportToJSON();
localStorage.setItem('scheduler-learning-data', json);

// Verileri içe aktar
const savedData = localStorage.getItem('scheduler-learning-data');
if (savedData) {
  db.importFromJSON(savedData);
}

// Verileri temizle
clearLearningData();
```

### Örnek Çıktı

```
🎓 Learned optimal parameters from historical data
   Based on 12 successful attempts
   Problem type: c45_r12_u0.9_l1
   Student weight: 2.34
   Classroom scarcity: 6.12
   Session duration: 1.45
   Hill climbing iterations: 42
```

---

## 🚀 Paralel Zamanlama

Farklı seed değerleriyle paralel denemeler yaparak en iyi sonucu seçer.

### Kullanım

```typescript
import { parallelSchedule } from '@/lib/scheduler/parallel-scheduler';

const result = await parallelSchedule(config, {
  parallelAttempts: 3,        // 3 paralel deneme
  selectBestBy: 'combined',   // Seçim kriteri
  seedBase: 12345,            // Opsiyonel seed
});

console.log('Best schedule:', result.bestSchedule);
console.log('Best seed:', result.bestSeed);
console.log('Best score:', result.bestScore);
```

### Seçim Kriterleri

| Kriter | Açıklama |
|--------|----------|
| `success_rate` | En yüksek başarı oranı |
| `capacity_usage` | En iyi kapasite kullanımı |
| `teacher_balance` | En dengeli öğretmen yükü |
| `combined` | Tüm metriklerin kombinasyonu (önerilen) |

### Performans

- **3 deneme**: ~3x süre, %10-20 daha iyi sonuç
- **5 deneme**: ~5x süre, %15-30 daha iyi sonuç

### Quick Parallel

Hızlı kullanım için:

```typescript
import { quickParallelSchedule } from '@/lib/scheduler/parallel-scheduler';

// 3 deneme yapar, en iyisini döner
const schedule = await quickParallelSchedule(config);
```

### Örnek Çıktı

```
🚀 Starting Parallel Scheduling
   Attempts: 3
   Selection criteria: combined
🔄 Parallel attempt 1 starting (seed: 1234567890)
✅ Attempt 1 complete: 92.3% success
🔄 Parallel attempt 2 starting (seed: 1234568890)
✅ Attempt 2 complete: 95.6% success
🔄 Parallel attempt 3 starting (seed: 1234569890)
✅ Attempt 3 complete: 89.1% success

🏆 Parallel Scheduling Complete
   Best attempt: seed 1234568890
   Success rate: 95.6%
   Score: 135.42
   Capacity waste: 12.3%
   Teacher balance: σ=2.45

📊 All Attempts Comparison:
   #1 (seed 1234567890): 92.3% success, score 128.34
   #2 (seed 1234568890): 95.6% success, score 135.42
   #3 (seed 1234569890): 89.1% success, score 121.67
```

---

## 💡 Kullanım Örnekleri

### Örnek 1: Hızlı Zamanlama (Varsayılan)

```typescript
const config: SchedulerConfig = {
  courses,
  classrooms,
  timeBlocks,
  features: {
    enableSessionSplitting: true,
    enableCombinedTheoryLab: true,
    enableBacktracking: true,
    enableAdaptiveConfig: true,  // Otomatik optimizasyon
    enableLearning: true,         // Geçmişten öğren
  },
};

const generator = generateSchedule(config);
for await (const progress of generator) {
  console.log(progress.message);
}
```

### Örnek 2: Maksimum Kalite

```typescript
const config: SchedulerConfig = {
  courses,
  classrooms,
  timeBlocks,
  features: {
    enableSessionSplitting: true,
    enableCombinedTheoryLab: true,
    enableBacktracking: true,
    enableAdaptiveConfig: true,
    enableLearning: true,
    enableSimulatedAnnealing: true,  // Ekstra optimizasyon
  },
};

// Paralel denemelerle en iyisini bul
const result = await parallelSchedule(config, {
  parallelAttempts: 5,
  selectBestBy: 'combined',
});
```

### Örnek 3: Deterministik Sonuç

```typescript
const config: SchedulerConfig = {
  courses,
  classrooms,
  timeBlocks,
  seed: 12345,  // Sabit seed = aynı sonuç
  features: {
    enableAdaptiveConfig: false,  // Adaptasyonu kapat
    enableLearning: false,         // Öğrenmeyi kapat
  },
};
```

### Örnek 4: Öğrenme Verilerini Yönet

```typescript
import { 
  getLearningDatabase,
  getLearningStats 
} from '@/lib/scheduler/learning-system';

// Zamanlama yap
const generator = generateSchedule(config);
for await (const progress of generator) {
  // ...
}

// İstatistikleri kontrol et
const stats = getLearningStats();
console.log(`Toplam kayıt: ${stats.totalRecords}`);
console.log(`Ortalama başarı: ${(stats.avgSuccessRate * 100).toFixed(1)}%`);

// Verileri kaydet
const db = getLearningDatabase();
const json = db.exportToJSON();
await fetch('/api/save-learning-data', {
  method: 'POST',
  body: json,
});
```

---

## 🎯 Önerilen Konfigürasyonlar

### Küçük Fakülteler (<30 ders)

```typescript
{
  features: {
    enableAdaptiveConfig: true,
    enableLearning: true,
    enableSimulatedAnnealing: true,  // Kalite için
  },
}
```

### Orta Fakülteler (30-100 ders)

```typescript
{
  features: {
    enableAdaptiveConfig: true,
    enableLearning: true,
    enableSimulatedAnnealing: false,  // Hız için
  },
}
```

### Büyük Fakülteler (>100 ders)

```typescript
{
  features: {
    enableAdaptiveConfig: true,   // Otomatik ayarlama
    enableLearning: true,          // Sürekli iyileşme
    enableSimulatedAnnealing: false,
  },
  timeoutMs: 180000,  // 3 dakika
}
```

### Kalite Odaklı

```typescript
// Paralel + Simulated Annealing
const result = await parallelSchedule({
  ...config,
  features: {
    enableSimulatedAnnealing: true,
  },
}, {
  parallelAttempts: 5,
  selectBestBy: 'combined',
});
```

---

## 📊 Performans Karşılaştırması

| Konfigürasyon | Süre | Başarı Oranı | Kalite Skoru |
|---------------|------|--------------|--------------|
| Varsayılan | 1x | 90% | 100 |
| + Adaptive | 1.1x | 93% | 108 |
| + Learning | 1.1x | 95% | 112 |
| + Simulated Annealing | 2.5x | 96% | 125 |
| + Parallel (3x) | 3x | 98% | 132 |
| Tümü | 7.5x | 99% | 145 |

*Notlar: 50 ders, 15 derslik, orta karmaşıklık problemi için benchmark*

---

## 🔍 Troubleshooting

### Problem: Öğrenme sistemi çalışmıyor

**Çözüm**: En az 3 benzer problem gereklidir. Daha fazla zamanlama yapın.

### Problem: Simulated annealing çok yavaş

**Çözüm**: Parametreleri ayarlayın:
```typescript
simulatedAnnealing: {
  maxIterations: 30,  // 50'den düşür
  coolingRate: 0.90,  // Daha hızlı soğut
}
```

### Problem: Paralel zamanlama hata veriyor

**Çözüm**: Async generator'ı doğru kullanın. Örneklere bakın.

---

## 📚 API Referansı

### `createAdaptiveConfig()`
```typescript
function createAdaptiveConfig(
  courses: CourseData[],
  classrooms: ClassroomData[],
  baseConfig: SchedulerSettings,
  runtimeMetrics?: RuntimeMetrics
): SchedulerSettings
```

### `simulatedAnnealing()`
```typescript
function simulatedAnnealing(
  initialSchedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classrooms: ClassroomData[],
  rng: () => number,
  config?: AnnealingConfig
): ScheduleItem[]
```

### `parallelSchedule()`
```typescript
function parallelSchedule(
  config: SchedulerConfig,
  parallelConfig?: ParallelConfig
): Promise<ParallelResult>
```

### `recordSchedulingAttempt()`
```typescript
function recordSchedulingAttempt(
  config: SchedulerSettings,
  courses: CourseData[],
  classrooms: ClassroomData[],
  schedule: ScheduleItem[],
  duration: number,
  metrics: SchedulerMetrics
): void
```

### `learnOptimalParameters()`
```typescript
function learnOptimalParameters(
  courses: CourseData[],
  classrooms: ClassroomData[]
): Partial<SchedulerSettings> | null
```

---

## 🎓 Daha Fazla Bilgi

- [Ana README](./README.md)
- [Scheduler Optimizasyonları](./SCHEDULER_OPTIMIZATION.md)
- [API Dokümantasyonu](./API.md)

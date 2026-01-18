# Scheduler API Documentation

## Endpoints

### 1. Generate Schedule (Legacy - Blocking)

**POST** `/api/scheduler/generate`

Eski blocking API. Geriye dönük uyumluluk için korunmuştur.

#### Request

```json
// Body yok - GET request gibi kullan
```

#### Response

```json
{
  "success": true,
  "message": "150 saatlik ders başarıyla programlandı",
  "scheduled_count": 150,
  "unscheduled_count": 2,
  "success_rate": 98,
  "schedule": [...],
  "unscheduled": [...],
  "perfect": false,
  "metrics": {
    "avg_capacity_margin": 25.5,
    "max_capacity_waste": 45.2,
    "teacher_load_stddev": 3.2
  }
}
```

---

### 2. Generate Schedule with Streaming (Yeni - Önerilen)

**GET** `/api/scheduler/generate-stream`

Real-time progress güncellemeleri ile program oluşturur.

#### Server-Sent Events (SSE) Format

```
data: {"stage":"initializing","progress":0,"message":"Başlatılıyor..."}

data: {"stage":"hardcoded","progress":20,"message":"Sabit programlar işleniyor..."}

data: {"stage":"scheduling","progress":45,"message":"Dersler programlanıyor: 50/100","currentCourse":"BIL101 - Programlama"}

data: {"stage":"optimizing","progress":85,"message":"Optimize ediliyor..."}

data: {"stage":"complete","progress":100,"message":"Tamamlandı!","result":{...}}
```

#### Progress Stages

| Stage | Progress | Description |
|-------|----------|-------------|
| `initializing` | 0-10% | Başlangıç hazırlıkları |
| `hardcoded` | 10-20% | Sabit programları işle |
| `scheduling` | 20-85% | Dersleri programla |
| `optimizing` | 85-100% | Lokal iyileştirme |
| `complete` | 100% | Tamamlandı |
| `error` | - | Hata oluştu |

---

## Client Implementations

### React (Önerilen)

```typescript
import { useState, useEffect } from 'react';

export function useSchedulerStream() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = async () => {
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/scheduler/generate-stream');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            setProgress(data.progress);
            setStage(data.stage);
            setMessage(data.message);

            if (data.result) {
              setResult(data.result);
            }

            if (data.stage === 'error') {
              setError(data.message);
            }
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return { progress, stage, message, result, error, generateSchedule };
}
```

### React Query Integration

```typescript
import { useMutation } from '@tanstack/react-query';

export function useGenerateSchedule() {
  return useMutation({
    mutationFn: async () => {
      // Streaming logic
    },
    onSuccess: (data) => {
      // Invalidate schedules query
      queryClient.invalidateQueries(['schedules']);
    }
  });
}
```

### Next.js Server Actions (Alternative)

```typescript
'use server';

export async function generateScheduleAction() {
  // Stream'i handle et
}
```

---

## Rate Limiting

- Maximum 1 concurrent schedule generation per user
- Timeout: 5 minutes
- Auto-cancel on client disconnect

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Yetkisiz erişim` | Not admin | Login as admin |
| `Aktif ders bulunamadı` | No active courses | Add courses |
| `Aktif derslik bulunamadı` | No active classrooms | Add classrooms |
| `Connection timeout` | Network issue | Retry |
| `Scheduler timeout` | >5 min runtime | Reduce courses or increase capacity |

### Retry Logic

```typescript
async function generateWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await generateSchedule();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Performance Tips

### 1. Use Streaming API

✅ DO:
```typescript
fetch('/api/scheduler/generate-stream'); // Real-time updates
```

❌ DON'T:
```typescript
fetch('/api/scheduler/generate', { method: 'POST' }); // Blocking, timeout risk
```

### 2. Show Progress to User

```tsx
<Progress value={progress} />
<p>{message}</p>
{currentCourse && <p>İşleniyor: {currentCourse}</p>}
```

### 3. Handle Disconnects

```typescript
const controller = new AbortController();

// Cancel on component unmount
useEffect(() => {
  return () => controller.abort();
}, []);

fetch('/api/scheduler/generate-stream', {
  signal: controller.signal
});
```

---

## Monitoring & Debugging

### Server Logs

```typescript
import logger from '@/lib/logger';

logger.info('Scheduler started', {
  courseCount: courses.length,
  classroomCount: classrooms.length
});
```

### Client Debug

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Progress:', data);
}
```

### Performance Metrics

The result includes detailed metrics:

```json
{
  "metrics": {
    "avg_capacity_margin": 25.5,  // Average unused classroom capacity
    "max_capacity_waste": 45.2,   // Worst case capacity waste
    "teacher_load_stddev": 3.2    // Balance of teacher workloads
  },
  "duration": 45000  // Total time in milliseconds
}
```

---

## Migration from Legacy API

### Before

```typescript
const response = await fetch('/api/scheduler/generate', {
  method: 'POST'
});
const result = await response.json();
```

### After

```typescript
const response = await fetch('/api/scheduler/generate-stream');
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process SSE events
}
```

---

## Best Practices

1. **Always use streaming API** for better UX
2. **Show progress** to keep users informed
3. **Handle errors gracefully** with retry logic
4. **Cancel on unmount** to prevent memory leaks
5. **Log errors** for debugging
6. **Monitor performance** with metrics

---

**Last Updated:** 18 Ocak 2026  
**API Version:** 2.0.0

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Cog, ChevronRight, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsForm } from '@/components/settings/settings-form';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Ayarlar"
        description="Sistem ayarlarını görüntüleyin ve düzenleyin"
        icon={Settings}
        entity="settings"
      />

      <div className="mb-6">
        <SettingsForm />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scheduler Settings Card */}
        <Link href="/settings/scheduler" className="block group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Cog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Scheduler Bilgileri</CardTitle>
                    <CardDescription>Algoritma hakkında bilgi</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Program oluşturma algoritmasının kısıtları ve özellikleri hakkında detaylı bilgi.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* User Manual Card */}
        <Link href="/settings/manual" className="block group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <BookOpen className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Kullanım Kılavuzu</CardTitle>
                    <CardDescription>Sistem kullanım rehberi</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hızlı başlangıç, modül kullanımı, ipuçları ve uyarılar.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Bilgileri</CardTitle>
            <CardDescription>Mevcut oturum bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kullanıcı Adı</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rol</span>
              <Badge>{user?.role === 'admin' ? 'Yönetici' : 'Öğretmen'}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yetkiler</span>
              <div className="flex flex-wrap gap-1">
                {user?.permissions?.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem Bilgileri</CardTitle>
            <CardDescription>Uygulama ve API bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uygulama Versiyonu</span>
              <span className="font-medium">3.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">Next.js 16</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">API URL</span>
              <span className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Hakkında</CardTitle>
            <CardDescription>PlanEdu - Ders Programı Yönetim Sistemi v3.0</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              PlanEdu, üniversiteler için geliştirilmiş modern bir ders programı yönetim sistemidir.
                              Akıllı sezgisel algoritma (Smart Greedy) kullanarak otomatik program oluşturma özelliğine sahiptir.            </p>
            <p>
              <strong>v3.0 Yenilikleri:</strong>
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>1 saatlik zaman blokları ve oturum bölme</li>
              <li>Kapasite marjı desteği</li>
              <li>Derslik önceliklendirme (bölüm bazlı)</li>
              <li>Sabit (hardcoded) program desteği</li>
              <li>Derslik ve öğretmen uygunluk saatleri</li>
              <li>Aktif/pasif durum kontrolleri</li>
              <li>Öğretmen ve derslik profil modelleri</li>
              <li>Gelişmiş filtreler</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';

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
        description="Sistem ayarlarını görüntüleyin"
        icon={Settings}
        entity="settings"
      />

      <div className="grid gap-6 md:grid-cols-2">
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
              <span className="font-medium">2.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">Next.js 15</span>
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
            <CardDescription>PlanEdu - Ders Programı Yönetim Sistemi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              PlanEdu, üniversiteler için geliştirilmiş modern bir ders programı yönetim sistemidir.
              Genetik algoritma kullanarak otomatik program oluşturma özelliğine sahiptir.
            </p>
            <p>
              <strong>Özellikler:</strong>
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Öğretmen, ders ve derslik yönetimi</li>
              <li>Fakülte ve bölüm bazlı organizasyon</li>
              <li>Genetik algoritma ile otomatik program oluşturma</li>
              <li>Excel ile toplu veri aktarımı</li>
              <li>Rol tabanlı yetkilendirme</li>
              <li>Modern ve responsive arayüz</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

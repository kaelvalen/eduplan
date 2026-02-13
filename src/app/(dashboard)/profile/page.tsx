'use client';

import { useState } from 'react';
import { User, Shield, Key, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Şifre başarıyla değiştirildi');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch {
      toast.error('Şifre değiştirilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.pageContainer} max-w-4xl mx-auto`}>
      <PageHeader
        title="Profil"
        description="Hesap bilgilerinizi görüntüleyin ve yönetin"
        icon={User}
        entity="settings"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <UserAvatar name={user?.username || 'User'} size="lg" className="h-24 w-24 text-2xl" />
              <h2 className="mt-4 text-xl font-semibold">{user?.username}</h2>
              <Badge className="mt-2" variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                {user?.role === 'admin' ? 'Yönetici' : 'Öğretim Elemanı'}
              </Badge>
              <p className="mt-4 text-sm text-muted-foreground">
                PlanEdu sistemine hoş geldiniz. Bu sayfadan hesap bilgilerinizi görüntüleyebilir ve şifrenizi değiştirebilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Hesap Bilgileri
            </CardTitle>
            <CardDescription>Hesabınızla ilgili temel bilgiler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Kullanıcı Adı</Label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user?.username}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Rol</Label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user?.role === 'admin' ? 'Yönetici' : 'Öğretim Elemanı'}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-muted-foreground">Yetkiler</Label>
              <div className="flex flex-wrap gap-2">
                {user?.permissions?.map((perm) => (
                  <Badge key={perm} variant="outline">
                    {perm}
                  </Badge>
                )) || (
                  <span className="text-sm text-muted-foreground">Yetki bilgisi bulunamadı</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Şifre Değiştir
          </CardTitle>
          <CardDescription>Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirin</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Şifrenizi değiştirmek için aşağıdaki butona tıklayın.
                </p>
              </div>
              <Button onClick={() => setIsChangingPassword(true)}>
                <Key className="mr-2 h-4 w-4" />
                Şifre Değiştir
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Alert variant="info">
                <AlertTitle>Güvenlik İpucu</AlertTitle>
                <AlertDescription>
                  Güçlü bir şifre için en az 8 karakter, büyük/küçük harf, rakam ve özel karakter kullanın.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Oturum Bilgileri</CardTitle>
          <CardDescription>Mevcut oturum hakkında bilgiler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Son Giriş</p>
              <p className="font-medium">{new Date().toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Tarayıcı</p>
              <p className="font-medium">Chrome</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">IP Adresi</p>
              <p className="font-medium">192.168.1.x</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

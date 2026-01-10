'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Eye, EyeOff, User, Lock, Sparkles, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const features = [
  { icon: Zap, text: 'Otomatik Planlama' },
  { icon: Shield, text: 'Güvenli Erişim' },
  { icon: Sparkles, text: 'Modern Arayüz' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, token } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast.success('Giriş başarılı! Hoş geldiniz.');
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Geçersiz kullanıcı adı veya şifre';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (user: 'admin' | 'teacher') => {
    const credentials = user === 'admin'
      ? { username: 'admin', password: 'admin123' }
      : { username: 'teacher', password: 'teacher123' };

    setUsername(credentials.username);
    setPassword(credentials.password);
    setIsLoading(true);

    try {
      await login(credentials.username, credentials.password);
      toast.success(`${user === 'admin' ? 'Yönetici' : 'Öğretmen'} olarak giriş yapıldı!`);
      router.push('/');
    } catch (error: unknown) {
      toast.error('Giriş yapılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Mobile Header - Gradient Background */}
      <div className="lg:hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 pt-safe-top pb-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PlanEdu</h1>
              <p className="text-xs text-white/70">v3.0</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Hoş Geldiniz! 👋
            </h2>
            <p className="text-sm text-white/80">
              Ders programı yönetim sistemine giriş yapın
            </p>
          </div>

          {/* Features - Horizontal on Mobile */}
          <div className="flex gap-4 mt-6 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-white/90 bg-white/10 rounded-full px-3 py-1.5 text-xs whitespace-nowrap flex-shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PlanEdu</h1>
              <p className="text-sm text-white/70">v3.0</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Ders Programı Yönetiminde
              <br />
              <span className="text-white/90">Yeni Nesil Çözüm</span>
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Yapay zeka destekli genetik algoritma ile otomatik program oluşturma,
              çakışma kontrolü ve akıllı optimizasyon.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Genetik Algoritma ile Otomatik Planlama' },
              { icon: Shield, text: 'Güvenli ve Rol Tabanlı Erişim' },
              { icon: Sparkles, text: 'Modern ve Kullanıcı Dostu Arayüz' },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2025 PlanEdu. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 py-6 lg:py-12 bg-background -mt-4 lg:mt-0 rounded-t-3xl lg:rounded-none relative z-10">
        <div className="w-full max-w-md space-y-6 lg:space-y-8">
          <Card className="border-0 shadow-xl lg:shadow-2xl">
            <CardHeader className="space-y-1 pb-4 hidden lg:block">
              <CardTitle className="text-2xl">Hoş Geldiniz</CardTitle>
              <CardDescription>
                Devam etmek için hesabınıza giriş yapın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 lg:pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Kullanıcı Adı</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Kullanıcı adınızı girin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 text-base"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Şifrenizi girin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 text-base"
                      required
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Beni hatırla
                    </label>
                  </div>
                  <Button variant="link" className="px-0 text-sm" type="button">
                    Şifremi unuttum
                  </Button>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    veya demo hesabı ile deneyin
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                  className="h-auto py-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Yönetici</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('teacher')}
                  disabled={isLoading}
                  className="h-auto py-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <User className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium">Öğretmen</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer - Hidden on mobile, shown on desktop */}
          <p className="hidden lg:block text-center text-sm text-muted-foreground">
            Giriş yaparak{' '}
            <Button variant="link" className="px-0 h-auto text-sm">
              Kullanım Koşulları
            </Button>
            {' '}ve{' '}
            <Button variant="link" className="px-0 h-auto text-sm">
              Gizlilik Politikası
            </Button>
            &apos;nı kabul etmiş olursunuz.
          </p>

          {/* Mobile Footer */}
          <div className="lg:hidden text-center pb-safe-bottom">
            <p className="text-xs text-muted-foreground">
              © 2026 PlanEdu • Tüm hakları saklıdır
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

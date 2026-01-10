'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Eye, EyeOff, User, Lock, Sparkles, Shield, Zap, ArrowRight, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const features = [
  { icon: Zap, text: 'Otomatik Planlama', description: 'Yapay zeka ile saniyeler içinde ders programı' },
  { icon: Shield, text: 'Güvenli Erişim', description: 'Rol tabanlı gelişmiş yetkilendirme sistemi' },
  { icon: Sparkles, text: 'Modern Arayüz', description: 'Kullanıcı dostu, hızlı ve akıcı deneyim' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, token } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-blob mix-blend-multiply opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full animate-blob animation-delay-2000 mix-blend-multiply opacity-70" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-pink-500/20 blur-[120px] rounded-full animate-blob animation-delay-4000 mix-blend-multiply opacity-70" />
      </div>

      <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 py-8 lg:py-0 h-full lg:h-[800px]">

        {/* Left Side: Branding & Features */}
        <div className="w-full lg:w-1/2 space-y-8 lg:pr-12 animate-slide-up">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">PlanEdu</h1>
                <p className="text-sm text-muted-foreground font-medium">Akıllı Ders Planlama</p>
              </div>
            </div>

            <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Geleceği <br />
              <span className="text-primary">Planlayın</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Yapay zeka teknolojisi ile ders programlarınızı saniyeler içinde oluşturun, çakışmaları önleyin ve verimliliği artırın.
            </p>
          </div>

          <div className="grid gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.text}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[420px] animate-scale-in animation-delay-200">
          <Card className="border-border/50 shadow-2xl shadow-primary/10 backdrop-blur-xl bg-card/80">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">Hoş Geldiniz</CardTitle>
              <CardDescription className="text-center">
                Hesabınıza erişmek için giriş yapın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="ad.soyad"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
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
                      className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      Beni hatırla
                    </label>
                  </div>
                  <Button variant="link" className="px-0 text-sm h-auto font-normal text-muted-foreground hover:text-primary" type="button">
                    Şifremi unuttum?
                  </Button>
                </div>

                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-medium">
                    veya demo hesabı
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Yönetici</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('teacher')}
                  disabled={isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-1 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium">Öğretmen</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground opacity-60">
            © 2026 PlanEdu. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}

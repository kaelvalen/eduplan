'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Loader2, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  Shield, 
  ArrowRight, 
  BookOpen,
  Calendar,
  Users,
  Target,
  BarChart3,
  Sparkle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const features = [
  { 
    icon: Calendar, 
    text: 'Otomatik Planlama', 
    description: 'Ders programı oluşturma',
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'
  },
  { 
    icon: Target, 
    text: 'Çakışma Önleme', 
    description: 'Otomatik çakışma kontrolü',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
  },
  { 
    icon: Users, 
    text: 'Kolay Yönetim', 
    description: 'Öğretmen ve derslik yönetimi',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
  },
  { 
    icon: BarChart3, 
    text: 'Raporlama', 
    description: 'Program raporları',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20'
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { login, token } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

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
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 via-indigo-50/30 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/15 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/15 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-blue-400/15 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '12s', animationDelay: '4s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Mouse Follow Gradient */}
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-500/8 via-purple-500/8 to-pink-500/8 rounded-full blur-3xl transition-all duration-700 ease-out pointer-events-none"
          style={{
            left: `${mousePosition.x - 128}px`,
            top: `${mousePosition.y - 128}px`,
            opacity: mousePosition.x > 0 ? 0.5 : 0,
          }}
        />
      </div>

      <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side: Enhanced Branding */}
          <div className="space-y-6 animate-fade-in">
            {/* Logo & Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse" />
                  {/* Icon container */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 via-purple-500 to-pink-500 shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                    <GraduationCap className="h-6 w-6 text-white drop-shadow-lg" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                    PlanEdu
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-muted-foreground font-medium">
                      Ders Planlama Sistemi
                    </p>
                    <Sparkle className="h-3 w-3 text-yellow-500 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  Ders Programlarınızı{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Kolayca Yönetin
                    </span>
                    <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-sm" />
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Ders programlarınızı oluşturun, düzenleyin ve yönetin.
                </p>
              </div>
            </div>

            {/* Enhanced Features Grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative p-4 rounded-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-transparent hover:shadow-xl transition-all duration-500 overflow-hidden"
                  >
                    {/* Gradient background on hover */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                      feature.bgGradient
                    )} />
                    
                    {/* Content */}
                    <div className="relative flex items-start gap-3">
                      <div className={cn(
                        "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                        `bg-gradient-to-br ${feature.gradient}`
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
                      </div>
                      <div className="flex-1 space-y-0.5 pt-0.5">
                        <h3 className="font-semibold text-foreground text-sm group-hover:text-foreground transition-colors">
                          {feature.text}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Premium Login Form */}
          <div className="w-full max-w-sm mx-auto lg:mx-0 animate-fade-in">
            <Card className="relative border-slate-200/60 dark:border-slate-800/60 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden">
              {/* Card gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
              
              <CardContent className="p-6 space-y-5">
                {/* Enhanced Header */}
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg mb-1 transform hover:scale-105 transition-transform">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Hoş Geldiniz
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Hesabınıza giriş yapın
                  </p>
                </div>

                {/* Enhanced Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-foreground">
                      Kullanıcı Adı
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-blue-500/15 group-focus-within:via-purple-500/15 group-focus-within:to-pink-500/15 blur-md transition-all duration-300 -z-10" />
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors duration-300" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Kullanıcı adınızı girin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 h-10 text-sm border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                        required
                        autoComplete="username"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                      Şifre
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-blue-500/15 group-focus-within:via-purple-500/15 group-focus-within:to-pink-500/15 blur-md transition-all duration-300 -z-10" />
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors duration-300" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Şifrenizi girin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-10 text-sm border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={isLoading}
                        className="border-2 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600 data-[state=checked]:border-transparent h-4 w-4"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer select-none font-medium hover:text-foreground transition-colors"
                      >
                        Beni hatırla
                      </label>
                    </div>
                    <Button 
                      variant="link" 
                      className="px-0 text-xs h-auto font-semibold text-muted-foreground hover:text-blue-600 transition-colors" 
                      type="button"
                      disabled={isLoading}
                    >
                      Şifremi unuttum?
                    </Button>
                  </div>

                  {/* Enhanced Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-10 text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={isLoading}
                  >
                    <span className="relative z-10 flex items-center justify-center">
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
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </Button>
                </form>

                {/* Enhanced Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-3 text-muted-foreground font-bold tracking-wider">
                      veya demo hesabı ile
                    </span>
                  </div>
                </div>

                {/* Enhanced Demo Login Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin('admin')}
                    disabled={isLoading}
                    className="h-auto py-2.5 flex flex-col items-center gap-1.5 border-2 hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-300" />
                    <Shield className="h-4 w-4 text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10" />
                    <div className="text-center relative z-10">
                      <div className="text-xs font-semibold">Yönetici</div>
                      <div className="text-[10px] text-muted-foreground font-medium">admin</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin('teacher')}
                    disabled={isLoading}
                    className="h-auto py-2.5 flex flex-col items-center gap-1.5 border-2 hover:border-emerald-500 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
                    <BookOpen className="h-4 w-4 text-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10" />
                    <div className="text-center relative z-10">
                      <div className="text-xs font-semibold">Öğretmen</div>
                      <div className="text-[10px] text-muted-foreground font-medium">teacher</div>
                    </div>
                  </Button>
                </div>

                {/* Enhanced Footer */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-center text-xs text-muted-foreground font-medium">
                    © 2026 PlanEdu. Tüm hakları saklıdır.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-15px) translateX(8px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

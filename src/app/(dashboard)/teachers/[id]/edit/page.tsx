'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const TeacherForm = dynamic(
  () => import('@/components/teachers/teacher-form').then(mod => ({ default: mod.TeacherForm })),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ),
    ssr: false,
  }
);

interface EditTeacherPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTeacherPage({ params }: EditTeacherPageProps) {
  const { id } = use(params);
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/teachers');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <div className="flex items-center gap-4">
        <Link href="/teachers">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          title="Öğretmen Düzenle"
          description="Öğretmen bilgilerini güncelleyin"
          icon={UserCog}
          entity="teachers"
        />
      </div>

      <TeacherForm teacherId={parseInt(id)} />
    </div>
  );
}

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ClassroomForm = dynamic(
  () => import('@/components/classrooms/classroom-form').then(mod => ({ default: mod.ClassroomForm })),
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

interface EditClassroomPageProps {
  params: Promise<{ id: string }>;
}

export default function EditClassroomPage({ params }: EditClassroomPageProps) {
  const { id } = use(params);
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/classrooms');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <div className="flex items-center gap-4">
        <Link href="/classrooms">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          title="Derslik Düzenle"
          description="Derslik bilgilerini güncelleyin"
          icon={Building2}
          entity="classrooms"
        />
      </div>

      <ClassroomForm classroomId={parseInt(id)} />
    </div>
  );
}

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { ClassroomForm } from '@/components/classrooms/classroom-form';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

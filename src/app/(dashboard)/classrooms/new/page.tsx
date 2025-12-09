'use client';

import Link from 'next/link';
import { ChevronLeft, Building } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { ClassroomForm } from '@/components/classrooms/classroom-form';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewClassroomPage() {
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
          title="Yeni Derslik"
          description="Yeni bir derslik ekleyin"
          icon={Building}
          entity="classrooms"
        />
      </div>

      <ClassroomForm />
    </div>
  );
}

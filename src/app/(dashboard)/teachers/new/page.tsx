'use client';

import Link from 'next/link';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { TeacherForm } from '@/components/teachers/teacher-form';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewTeacherPage() {
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
          title="Yeni Öğretmen"
          description="Yeni bir öğretmen ekleyin"
          icon={UserPlus}
          entity="teachers"
        />
      </div>

      <TeacherForm />
    </div>
  );
}

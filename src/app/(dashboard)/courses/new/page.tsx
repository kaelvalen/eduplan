'use client';

import Link from 'next/link';
import { ChevronLeft, BookPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { CourseForm } from '@/components/courses/course-form';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewCoursePage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/courses');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <div className="flex items-center gap-4">
        <Link href="/courses">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          title="Yeni Ders"
          description="Yeni bir ders ekleyin"
          icon={BookPlus}
          entity="courses"
        />
      </div>

      <CourseForm />
    </div>
  );
}

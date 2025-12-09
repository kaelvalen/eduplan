'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, BookOpenCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { CourseForm } from '@/components/courses/course-form';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = use(params);
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
          title="Ders Düzenle"
          description="Ders bilgilerini güncelleyin"
          icon={BookOpenCheck}
          entity="courses"
        />
      </div>

      <CourseForm courseId={parseInt(id)} />
    </div>
  );
}

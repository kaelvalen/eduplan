import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingWizard } from './onboarding-wizard';
import type { Statistics } from '@/types';

// Mock Lucide icons
// vi.mock('lucide-react', async (importOriginal) => {
//   const actual = await importOriginal();
//   return {
//     ...actual,
//     // You can mock specific icons if needed, or leave them as is
//   };
// });

describe('OnboardingWizard', () => {
  const emptyStats: Statistics = {
    teacherCount: 0,
    courseCount: 0,
    classroomCount: 0,
    scheduleCount: 0,
  };

  const partialStats: Statistics = {
    teacherCount: 5,
    courseCount: 0,
    classroomCount: 0,
    scheduleCount: 0,
  };

  const fullStats: Statistics = {
    teacherCount: 10,
    courseCount: 10,
    classroomCount: 5,
    scheduleCount: 1,
  };

  it('renders correctly with empty stats', () => {
    render(<OnboardingWizard stats={emptyStats} />);

    expect(screen.getByText(/Kurulum Sihirbazı/)).toBeDefined();
    expect(screen.getByText('Sistem Ayarları')).toBeDefined();
    expect(screen.getByText('Öğretmenler')).toBeDefined();

    // Progress should be low (only settings step might be considered implicitly started or 0)
    // Based on implementation: Settings is complete if teacher > 0 or classroom > 0. So here it's 0.
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('marks steps as complete based on stats', () => {
    render(<OnboardingWizard stats={partialStats} />);

    // Teachers step should be complete or active?
    // Implementation: isComplete: stats.teacherCount > 0
    // So Teachers step is complete.
    // Progress calculation: Settings (complete because teacher>0), Teachers (complete).
    // Classrooms (0), Courses (0), Scheduler (0).
    // 2/5 = 40%

    expect(screen.getByText('40%')).toBeDefined();
  });

  it('does not render when setup is complete', () => {
    const { container } = render(<OnboardingWizard stats={fullStats} />);
    expect(container.firstChild).toBeNull();
  });
});

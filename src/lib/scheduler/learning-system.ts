/**
 * Learning System for Scheduler Parameters
 * Tracks scheduling attempts and learns optimal parameters
 */

import type { SchedulerSettings } from './config';
import type { ScheduleItem, CourseData, ClassroomData } from './types';

/**
 * Record of a scheduling attempt with its parameters and results
 */
export interface SchedulingRecord {
  timestamp: number;
  problemHash: string; // Hash of problem characteristics for grouping similar problems
  config: SchedulerSettings;
  results: {
    successRate: number;
    scheduledCount: number;
    totalCourses: number;
    duration: number;
    avgCapacityMargin: number;
    maxCapacityWaste: number;
    teacherLoadStddev: number;
  };
  problemCharacteristics: {
    courseCount: number;
    classroomCount: number;
    avgStudentsPerCourse: number;
    classroomUtilization: number;
    hasLabCourses: boolean;
  };
}

/**
 * Learning database (in-memory, can be persisted to file/DB)
 */
class LearningDatabase {
  private records: SchedulingRecord[] = [];
  private maxRecords: number = 1000;

  addRecord(record: SchedulingRecord): void {
    this.records.push(record);
    
    // Keep only the most recent records
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  getRecords(filter?: {
    minSuccessRate?: number;
    problemHashPrefix?: string;
    limit?: number;
  }): SchedulingRecord[] {
    let filtered = [...this.records];
    
    if (filter?.minSuccessRate !== undefined) {
      filtered = filtered.filter(r => r.results.successRate >= filter.minSuccessRate!);
    }
    
    if (filter?.problemHashPrefix) {
      filtered = filtered.filter(r => r.problemHash.startsWith(filter.problemHashPrefix!));
    }
    
    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }
    
    return filtered;
  }

  getSimilarProblems(
    characteristics: SchedulingRecord['problemCharacteristics'],
    tolerance: number = 0.2
  ): SchedulingRecord[] {
    return this.records.filter(record => {
      const char = record.problemCharacteristics;
      
      // Check if problem characteristics are similar within tolerance
      const courseCountSimilar = Math.abs(char.courseCount - characteristics.courseCount) / 
        Math.max(char.courseCount, characteristics.courseCount) < tolerance;
      
      const classroomCountSimilar = Math.abs(char.classroomCount - characteristics.classroomCount) / 
        Math.max(char.classroomCount, characteristics.classroomCount) < tolerance;
      
      const utilizationSimilar = Math.abs(char.classroomUtilization - characteristics.classroomUtilization) < tolerance;
      
      const labSimilar = char.hasLabCourses === characteristics.hasLabCourses;
      
      return courseCountSimilar && classroomCountSimilar && utilizationSimilar && labSimilar;
    });
  }

  clear(): void {
    this.records = [];
  }

  exportToJSON(): string {
    return JSON.stringify(this.records, null, 2);
  }

  importFromJSON(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.records = imported;
      }
    } catch (error) {
      console.error('Failed to import learning data:', error);
    }
  }

  getStats(): {
    totalRecords: number;
    avgSuccessRate: number;
    bestSuccessRate: number;
    avgDuration: number;
  } {
    if (this.records.length === 0) {
      return {
        totalRecords: 0,
        avgSuccessRate: 0,
        bestSuccessRate: 0,
        avgDuration: 0,
      };
    }

    const avgSuccessRate = this.records.reduce((sum, r) => sum + r.results.successRate, 0) / this.records.length;
    const bestSuccessRate = Math.max(...this.records.map(r => r.results.successRate));
    const avgDuration = this.records.reduce((sum, r) => sum + r.results.duration, 0) / this.records.length;

    return {
      totalRecords: this.records.length,
      avgSuccessRate,
      bestSuccessRate,
      avgDuration,
    };
  }
}

// Global learning database instance
const learningDB = new LearningDatabase();

/**
 * Hash problem characteristics for grouping
 */
function hashProblemCharacteristics(
  courses: CourseData[],
  classrooms: ClassroomData[]
): string {
  const courseCount = courses.length;
  const classroomCount = classrooms.filter(c => c.isActive).length;
  const hasLab = courses.some(c => c.sessions.some(s => s.type === 'lab'));
  
  const totalStudents = courses.reduce((sum, c) => 
    sum + c.departments.reduce((s, d) => s + d.studentCount, 0), 0
  );
  const totalCapacity = classrooms.reduce((sum, c) => c.isActive ? sum + c.capacity : sum, 0);
  const utilization = totalCapacity > 0 ? Math.floor((totalStudents / totalCapacity) * 10) / 10 : 0;
  
  return `c${courseCount}_r${classroomCount}_u${utilization}_l${hasLab ? 1 : 0}`;
}

/**
 * Record a scheduling attempt
 */
export function recordSchedulingAttempt(
  config: SchedulerSettings,
  courses: CourseData[],
  classrooms: ClassroomData[],
  schedule: ScheduleItem[],
  duration: number,
  metrics: {
    avg_capacity_margin: number;
    max_capacity_waste: number;
    teacher_load_stddev: number;
  }
): void {
  const scheduledCourses = new Set(schedule.map(s => s.courseId)).size;
  const successRate = courses.length > 0 ? scheduledCourses / courses.length : 0;
  
  const totalStudents = courses.reduce((sum, c) => 
    sum + c.departments.reduce((s, d) => s + d.studentCount, 0), 0
  );
  const avgStudentsPerCourse = courses.length > 0 ? totalStudents / courses.length : 0;
  
  const totalCapacity = classrooms.reduce((sum, c) => c.isActive ? sum + c.capacity : sum, 0);
  const classroomUtilization = totalCapacity > 0 ? totalStudents / totalCapacity : 0;
  
  const record: SchedulingRecord = {
    timestamp: Date.now(),
    problemHash: hashProblemCharacteristics(courses, classrooms),
    config,
    results: {
      successRate,
      scheduledCount: scheduledCourses,
      totalCourses: courses.length,
      duration,
      avgCapacityMargin: metrics.avg_capacity_margin,
      maxCapacityWaste: metrics.max_capacity_waste,
      teacherLoadStddev: metrics.teacher_load_stddev,
    },
    problemCharacteristics: {
      courseCount: courses.length,
      classroomCount: classrooms.filter(c => c.isActive).length,
      avgStudentsPerCourse,
      classroomUtilization,
      hasLabCourses: courses.some(c => c.sessions.some(s => s.type === 'lab')),
    },
  };
  
  learningDB.addRecord(record);
  
  console.log('📝 Scheduling attempt recorded');
  console.log(`   Problem: ${record.problemHash}`);
  console.log(`   Success rate: ${(successRate * 100).toFixed(1)}%`);
}

/**
 * Learn optimal parameters from historical data
 */
export function learnOptimalParameters(
  courses: CourseData[],
  classrooms: ClassroomData[]
): Partial<SchedulerSettings> | null {
  const problemHash = hashProblemCharacteristics(courses, classrooms);
  
  const totalStudents = courses.reduce((sum, c) => 
    sum + c.departments.reduce((s, d) => s + d.studentCount, 0), 0
  );
  const avgStudentsPerCourse = courses.length > 0 ? totalStudents / courses.length : 0;
  const totalCapacity = classrooms.reduce((sum, c) => c.isActive ? sum + c.capacity : sum, 0);
  const classroomUtilization = totalCapacity > 0 ? totalStudents / totalCapacity : 0;
  
  const characteristics = {
    courseCount: courses.length,
    classroomCount: classrooms.filter(c => c.isActive).length,
    avgStudentsPerCourse,
    classroomUtilization,
    hasLabCourses: courses.some(c => c.sessions.some(s => s.type === 'lab')),
  };
  
  // Find similar problems
  const similarProblems = learningDB.getSimilarProblems(characteristics);
  
  if (similarProblems.length < 3) {
    console.log('📚 Not enough historical data for learning (need at least 3 similar problems)');
    return null;
  }
  
  // Filter for successful attempts (>80% success rate)
  const successful = similarProblems.filter(r => r.results.successRate > 0.8);
  
  if (successful.length === 0) {
    console.log('📚 No successful attempts found in historical data');
    return null;
  }
  
  // Average the parameters from successful attempts
  const avgStudentWeight = successful.reduce((sum, r) => 
    sum + r.config.difficulty.studentWeightFactor, 0
  ) / successful.length;
  
  const avgClassroomScarcity = successful.reduce((sum, r) => 
    sum + r.config.difficulty.classroomScarcityFactor, 0
  ) / successful.length;
  
  const avgSessionDuration = successful.reduce((sum, r) => 
    sum + r.config.difficulty.sessionDurationFactor, 0
  ) / successful.length;
  
  const avgHillClimbingIterations = Math.round(
    successful.reduce((sum, r) => sum + r.config.hillClimbing.iterations, 0) / successful.length
  );
  
  console.log('🎓 Learned optimal parameters from historical data');
  console.log(`   Based on ${successful.length} successful attempts`);
  console.log(`   Problem type: ${problemHash}`);
  console.log(`   Student weight: ${avgStudentWeight.toFixed(2)}`);
  console.log(`   Classroom scarcity: ${avgClassroomScarcity.toFixed(2)}`);
  console.log(`   Session duration: ${avgSessionDuration.toFixed(2)}`);
  console.log(`   Hill climbing iterations: ${avgHillClimbingIterations}`);
  
  return {
    difficulty: {
      studentWeightFactor: avgStudentWeight,
      classroomScarcityFactor: avgClassroomScarcity,
      sessionDurationFactor: avgSessionDuration,
    },
    hillClimbing: {
      iterations: avgHillClimbingIterations,
      acceptanceRate: 0.1,
      improvementThreshold: 5,
    },
  };
}

/**
 * Get learning database for export/import
 */
export function getLearningDatabase(): LearningDatabase {
  return learningDB;
}

/**
 * Get learning statistics
 */
export function getLearningStats() {
  return learningDB.getStats();
}

/**
 * Clear learning database
 */
export function clearLearningData(): void {
  learningDB.clear();
  console.log('🗑️  Learning database cleared');
}

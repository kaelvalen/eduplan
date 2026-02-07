/**
 * Progress Reporter
 * Real-time progress tracking and reporting for scheduler
 */

import type { SchedulerProgress } from './types';
import type { SchedulerSettings } from './config';

export type ProgressCallback = (progress: SchedulerProgress) => void;

/**
 * Progress reporter for scheduler operations
 * Tracks and reports progress in real-time
 */
export class ProgressReporter {
  private startTime: number;
  private totalCourses: number;
  private totalSessions: number;
  private coursesProcessed: number;
  private sessionsScheduled: number;
  private currentCourse: string;
  private warnings: string[];
  private callback?: ProgressCallback;
  private lastReportTime: number;
  private config: SchedulerSettings;
  private stage: SchedulerProgress['stage'];

  constructor(totalCourses: number, totalSessions: number, config: SchedulerSettings, callback?: ProgressCallback) {
    this.startTime = Date.now();
    this.totalCourses = totalCourses;
    this.totalSessions = totalSessions;
    this.coursesProcessed = 0;
    this.sessionsScheduled = 0;
    this.currentCourse = '';
    this.warnings = [];
    this.callback = callback;
    this.lastReportTime = 0;
    this.config = config;
    this.stage = 'initializing';
  }

  /**
   * Set current stage
   */
  setStage(stage: SchedulerProgress['stage']): void {
    this.stage = stage;
    this.report();
  }

  /**
   * Update current course being processed
   */
  setCurrentCourse(courseName: string): void {
    this.currentCourse = courseName;
    this.coursesProcessed++;
    this.report();
  }

  /**
   * Increment sessions scheduled count
   */
  addScheduledSession(count: number = 1): void {
    this.sessionsScheduled += count;
    this.report();
  }

  /**
   * Add a warning message
   */
  addWarning(message: string): void {
    this.warnings.push(message);
    this.report();
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(): number {
    if (this.stage === 'initializing') return 5;
    if (this.stage === 'hardcoded') return 10;
    if (this.stage === 'complete') return 100;
    if (this.stage === 'error') return 0;

    // During scheduling: 10-90%
    if (this.stage === 'scheduling') {
      const courseProgress = this.totalCourses > 0 ? (this.coursesProcessed / this.totalCourses) * 80 : 0;
      return Math.min(90, 10 + courseProgress);
    }

    // During optimization: 90-100%
    if (this.stage === 'optimizing') {
      return 95;
    }

    return 0;
  }

  /**
   * Estimate time remaining in milliseconds
   */
  private estimateTimeRemaining(): number {
    if (this.coursesProcessed === 0) return 0;

    const elapsed = Date.now() - this.startTime;
    const avgTimePerCourse = elapsed / this.coursesProcessed;
    const remainingCourses = this.totalCourses - this.coursesProcessed;

    return Math.round(avgTimePerCourse * remainingCourses);
  }

  /**
   * Get current progress object
   */
  getProgress(): SchedulerProgress {
    return {
      stage: this.stage,
      progress: this.calculateProgress(),
      message: this.getCurrentMessage(),
      currentCourse: this.currentCourse,
      scheduledCount: this.sessionsScheduled,
      totalCourses: this.totalCourses,
      coursesProcessed: this.coursesProcessed,
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      warnings: [...this.warnings],
      startTime: this.startTime,
    };
  }

  /**
   * Get appropriate message based on stage
   */
  private getCurrentMessage(): string {
    switch (this.stage) {
      case 'initializing':
        return 'Başlatılıyor...';
      case 'hardcoded':
        return 'Sabit programlar işleniyor...';
      case 'scheduling':
        return `Dersler programlanıyor... (${this.coursesProcessed}/${this.totalCourses})`;
      case 'optimizing':
        return 'Program optimize ediliyor...';
      case 'complete':
        return 'Tamamlandı!';
      case 'error':
        return 'Hata oluştu';
      default:
        return 'İşleniyor...';
    }
  }

  /**
   * Report progress if enough time has elapsed
   */
  private report(): void {
    if (!this.config.features.enableProgressReporting || !this.callback) {
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastReportTime;

    // Report if interval elapsed or if stage changed
    if (elapsed >= this.config.performance.progressUpdateIntervalMs || this.stage !== 'scheduling') {
      this.callback(this.getProgress());
      this.lastReportTime = now;
    }
  }

  /**
   * Force immediate report
   */
  forceReport(): void {
    if (this.callback) {
      this.callback(this.getProgress());
      this.lastReportTime = Date.now();
    }
  }

  /**
   * Mark as complete
   */
  complete(): void {
    this.stage = 'complete';
    this.forceReport();
  }

  /**
   * Mark as error
   */
  error(message: string): void {
    this.stage = 'error';
    this.addWarning(message);
    this.forceReport();
  }

  /**
   * Get final statistics
   */
  getStats(): {
    totalDuration: number;
    coursesProcessed: number;
    sessionsScheduled: number;
    successRate: number;
    warningCount: number;
  } {
    const totalDuration = Date.now() - this.startTime;
    const successRate = this.totalSessions > 0
      ? Math.round((this.sessionsScheduled / this.totalSessions) * 100)
      : 0;

    return {
      totalDuration,
      coursesProcessed: this.coursesProcessed,
      sessionsScheduled: this.sessionsScheduled,
      successRate,
      warningCount: this.warnings.length,
    };
  }
}

/**
 * Timeout manager
 * Handles operation timeout with graceful shutdown
 */
export class TimeoutManager {
  private startTime: number;
  private timeoutMs: number;
  private checkInterval: NodeJS.Timeout | null;
  private onTimeout?: () => void;

  constructor(timeoutMs: number, onTimeout?: () => void) {
    this.startTime = Date.now();
    this.timeoutMs = timeoutMs;
    this.checkInterval = null;
    this.onTimeout = onTimeout;
  }

  /**
   * Start monitoring for timeout
   */
  start(): void {
    if (this.timeoutMs <= 0) return; // No timeout

    // Check every second
    this.checkInterval = setInterval(() => {
      if (this.isTimedOut()) {
        this.trigger();
      }
    }, 1000);
  }

  /**
   * Check if timed out
   */
  isTimedOut(): boolean {
    if (this.timeoutMs <= 0) return false;
    return Date.now() - this.startTime >= this.timeoutMs;
  }

  /**
   * Get remaining time in ms
   */
  getRemainingTime(): number {
    if (this.timeoutMs <= 0) return Infinity;
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.timeoutMs - elapsed);
  }

  /**
   * Get elapsed time in ms
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Trigger timeout callback and stop monitoring
   */
  private trigger(): void {
    this.stop();
    if (this.onTimeout) {
      this.onTimeout();
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Reset timer
   */
  reset(): void {
    this.startTime = Date.now();
  }
}

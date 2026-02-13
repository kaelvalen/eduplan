/**
 * Timeout Manager for Scheduler
 * Enforces time limits on scheduling operations to prevent infinite hangs
 */

export class TimeoutManager {
  private startTime: number;
  private timeoutMs: number;
  private checkInterval: number;
  private lastCheck: number;

  /**
   * @param timeoutMs Maximum time allowed for the operation in milliseconds
   * @param checkInterval How often to check (in ms) to avoid performance overhead
   */
  constructor(timeoutMs: number = 60000, checkInterval: number = 100) {
    this.timeoutMs = timeoutMs;
    this.checkInterval = checkInterval;
    this.startTime = Date.now();
    this.lastCheck = this.startTime;
  }

  /**
   * Check if timeout has been exceeded
   * Only checks at intervals to avoid performance overhead
   */
  isTimedOut(): boolean {
    const now = Date.now();

    // Only check every checkInterval ms to avoid overhead
    if (now - this.lastCheck < this.checkInterval) {
      return false;
    }

    this.lastCheck = now;
    return (now - this.startTime) > this.timeoutMs;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingMs(): number {
    return Math.max(0, this.timeoutMs - this.getElapsedMs());
  }

  /**
   * Get progress as percentage (0-100)
   */
  getTimeProgress(): number {
    return Math.min(100, (this.getElapsedMs() / this.timeoutMs) * 100);
  }

  /**
   * Throw error if timed out
   */
  checkAndThrow(): void {
    if (this.isTimedOut()) {
      throw new Error(`Scheduler timeout exceeded: ${this.timeoutMs}ms`);
    }
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = Date.now();
    this.lastCheck = this.startTime;
  }
}

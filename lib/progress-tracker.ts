interface GlobalProgress {
  isRunning: boolean
  username: string
  currentPage: number
  totalTweets: number
  status: string
  error?: string
  downloadUrl?: string
  startTime?: number
  estimatedCompletion?: number
}

class ProgressTracker {
  private static instance: ProgressTracker
  private progress: GlobalProgress = {
    isRunning: false,
    username: "",
    currentPage: 0,
    totalTweets: 0,
    status: "idle",
  }

  static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker()
    }
    return ProgressTracker.instance
  }

  startScraping(username: string): void {
    this.progress = {
      isRunning: true,
      username,
      currentPage: 0,
      totalTweets: 0,
      status: "Starting scrape...",
      startTime: Date.now(),
    }
  }

  updateProgress(update: Partial<GlobalProgress>): void {
    this.progress = { ...this.progress, ...update }
    
    // Estimate completion based on current progress
    if (this.progress.isRunning && this.progress.currentPage > 0) {
      const elapsed = Date.now() - (this.progress.startTime || Date.now())
      const avgTimePerPage = elapsed / this.progress.currentPage
      const estimatedTotalPages = Math.max(this.progress.currentPage * 2, 10) // Rough estimate
      const estimatedRemaining = (estimatedTotalPages - this.progress.currentPage) * avgTimePerPage
      this.progress.estimatedCompletion = Date.now() + estimatedRemaining
    }
  }

  completeScraping(totalTweets: number, totalPages: number): void {
    this.progress = {
      ...this.progress,
      isRunning: false,
      currentPage: totalPages,
      totalTweets,
      status: totalTweets > 0 ? "Completed successfully" : "No tweets found",
      downloadUrl: totalTweets > 0 ? `/api/bulk-scraper/download/${this.progress.username}` : undefined,
    }
  }

  failScraping(error: string): void {
    this.progress = {
      ...this.progress,
      isRunning: false,
      status: "Failed",
      error,
    }
  }

  getProgress(): GlobalProgress {
    return { ...this.progress }
  }

  isScraping(): boolean {
    return this.progress.isRunning
  }

  stopScraping(): void {
    this.progress = {
      ...this.progress,
      isRunning: false,
      status: "Stopped by user",
      error: "Scraping was cancelled by user",
    }
  }
}

export const progressTracker = ProgressTracker.getInstance()
export type { GlobalProgress }

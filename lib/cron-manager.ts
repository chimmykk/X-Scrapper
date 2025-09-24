import { runScraper } from "./twitter-scraper"

class CronManager {
  private static instance: CronManager
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): CronManager {
    if (!CronManager.instance) {
      CronManager.instance = new CronManager()
    }
    return CronManager.instance
  }

  async startCronJob(intervalMinutes = 480): Promise<void> {
    // Default 8 hours
    if (this.isRunning) {
      console.log("Cron job is already running")
      return
    }

    console.log(`[${new Date().toISOString()}] Starting cron job with ${intervalMinutes} minute interval`)

    // Run once immediately
    try {
      await this.runScraperTask()
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Initial scraper run failed:`, error)
    }

    // Schedule recurring runs
    this.intervalId = setInterval(
      async () => {
        try {
          await this.runScraperTask()
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Scheduled scraper run failed:`, error)
        }
      },
      intervalMinutes * 60 * 1000,
    )

    this.isRunning = true
    console.log(`[${new Date().toISOString()}] Cron job scheduled successfully`)
  }

  stopCronJob(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log(`[${new Date().toISOString()}] Cron job stopped`)
  }

  private async runScraperTask(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting scraper task...`)

    try {
      await runScraper()
      console.log(`[${new Date().toISOString()}] Scraper task completed successfully`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scraper task failed:`, error)
      throw error
    }
  }

  isJobRunning(): boolean {
    return this.isRunning
  }

  async restartCronJob(intervalMinutes = 480): Promise<void> {
    this.stopCronJob()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
    await this.startCronJob(intervalMinutes)
  }
}

export default CronManager

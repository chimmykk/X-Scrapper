"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Square, RefreshCw, Loader2 } from "lucide-react"

interface CronStatus {
  isRunning: boolean
  status: string
}

export function CronControl() {
  const [cronStatus, setCronStatus] = useState<CronStatus>({ isRunning: false, status: "inactive" })
  const [isLoading, setIsLoading] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(480) // Default 8 hours
  const [isRunningManual, setIsRunningManual] = useState(false)

  useEffect(() => {
    checkCronStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkCronStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkCronStatus = async () => {
    try {
      const response = await fetch("/api/cron/status")
      if (response.ok) {
        const data = await response.json()
        setCronStatus(data)
      }
    } catch (error) {
      console.error("Error checking cron status:", error)
    }
  }

  const startCronJob = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/cron/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intervalMinutes }),
      })

      if (response.ok) {
        await checkCronStatus()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to start cron job")
      }
    } catch (error) {
      console.error("Error starting cron job:", error)
      alert("Failed to start cron job")
    } finally {
      setIsLoading(false)
    }
  }

  const stopCronJob = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/cron/stop", {
        method: "POST",
      })

      if (response.ok) {
        await checkCronStatus()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to stop cron job")
      }
    } catch (error) {
      console.error("Error stopping cron job:", error)
      alert("Failed to stop cron job")
    } finally {
      setIsLoading(false)
    }
  }

  const runScraperManually = async () => {
    try {
      setIsRunningManual(true)
      const response = await fetch("/api/scraper/run", {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || "Scraper run completed successfully")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to run scraper")
      }
    } catch (error) {
      console.error("Error running scraper manually:", error)
      alert("Failed to run scraper")
    } finally {
      setIsRunningManual(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Scraper Control</h3>
          <Badge variant={cronStatus.isRunning ? "default" : "secondary"}>
            {cronStatus.isRunning ? "Running" : "Stopped"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="interval" className="text-sm">
              Interval (minutes):
            </Label>
            <Input
              id="interval"
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-20"
              min="1"
              disabled={cronStatus.isRunning}
            />
            <span className="text-xs text-muted-foreground">
              ({Math.floor(intervalMinutes / 60)}h {intervalMinutes % 60}m)
            </span>
          </div>

          <div className="flex gap-2">
            {!cronStatus.isRunning ? (
              <Button onClick={startCronJob} disabled={isLoading} size="sm" className="flex-1">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Start Auto-Scraper
              </Button>
            ) : (
              <Button onClick={stopCronJob} disabled={isLoading} variant="destructive" size="sm" className="flex-1">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
                Stop Auto-Scraper
              </Button>
            )}
          </div>

          <Button
            onClick={runScraperManually}
            disabled={isRunningManual}
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
          >
            {isRunningManual ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Run Scraper Now
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Auto-scraper runs every {intervalMinutes} minutes when active.</p>
          <p>Manual run executes immediately regardless of auto-scraper status.</p>
        </div>
      </div>
    </Card>
  )
}

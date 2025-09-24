const { spawn } = require('child_process');
const { CronJob } = require('cron');
const path = require('path');

// Resolve path to index.js (assumed to be in the same directory)
const scriptPath = path.join(__dirname, 'index.js');

// Function to spawn a child process to run index.js
const runScraper = () => {
  return new Promise((resolve, reject) => {
    console.log(`[${new Date().toISOString()}] Starting scraper child process...`);

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit', // Show child logs in parent console
      env: { ...process.env } // Pass environment variables
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[${new Date().toISOString()}] Scraper completed successfully`);
        resolve(`Child process exited with code ${code}`);
      } else {
        console.error(`[${new Date().toISOString()}] Scraper failed with code ${code}`);
        reject(new Error(`Child process exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Child process error: ${error.message}`);
      reject(error);
    });
  });
};

// Main function to run once on start and then every 4 minutes
async function main() {
  // Run once immediately
  try {
    await runScraper();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Initial run error: ${error.message}`);
  }

  // Schedule cron job to run every 4 minutes (UTC)
  const job = new CronJob(
    '0 */8 * * *',
    async () => {
      try {
        await runScraper();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Cron job error: ${error.message}`);
      }
    },
    null,
    true // Start immediately
  );

  console.log(`[${new Date().toISOString()}] Cron job scheduled to run every 2 minutes`);

  // Handle termination
  process.on('SIGINT', () => {
    console.log('Stopping cron job and exiting...');
    job.stop();
    process.exit(0);
  });
}

// Start the program
main();

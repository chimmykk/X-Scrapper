import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let cronProcess = null;

// Function to restart the cron job
async function restartCronJob() {
    try {
        // Kill existing cron job if it's running
        if (cronProcess) {
            try {
                await execAsync(`pkill -f "node cronjob.cjs"`);
            } catch (err) {
                // Ignore if no process was found to kill
                if (!err.message.includes('No matching processes')) {
                    console.error('Error killing existing cron job:', err);
                }
            }
        }

        // Start a new cron job
        console.log('Starting cron job...');
        cronProcess = exec('node cronjob.cjs');
        
        cronProcess.stdout.on('data', (data) => {
            console.log(`[Cron] ${data}`);
        });
        
        cronProcess.stderr.on('data', (data) => {
            console.error(`[Cron Error] ${data}`);
        });
        
        cronProcess.on('close', (code) => {
            console.log(`Cron job process exited with code ${code}`);
            cronProcess = null;
        });
        
    } catch (error) {
        console.error('Error restarting cron job:', error);
    }
}

// Resolve __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default config path
const CONFIG_PATH = path.join(__dirname, 'config.json');

// TwitterScraper class (from previous context, adapted here)
class TwitterScraper {
  constructor(configPath = 'config.json') {
    this.configPath = path.join(__dirname, configPath);
    this.config = null;
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      throw new Error(`❌ Failed to load config.json: ${error.message}`);
    }
  }

  async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`❌ Failed to save config.json: ${error.message}`);
    }
  }
}

// Initialize Express app
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API endpoint: /adduser
app.post('/adduser', async (req, res) => {
  const scraper = new TwitterScraper();

  try {
    // Load existing config
    await scraper.loadConfig();

    // Extract username from request body
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing username' });
    }

    // Check if username already exists
    const existingUser = scraper.config.users.find(user => user.username === username);
    if (existingUser) {
      return res.status(409).json({ error: `Username '${username}' already exists` });
    }

    // Create new user object with lastTimestampScrape as null for first default
    const newUser = {
      username,
      lastTimestampScrape: null
    };

    // Add new user to the users array
    scraper.config.users.push(newUser);

    // Save updated config
    await scraper.saveConfig();
    
    // Restart cron job to pick up the new user
    try {
      await restartCronJob();
      console.log(`Cron job restarted after adding user: ${username}`);
    } catch (cronError) {
      console.error('Error restarting cron job:', cronError);
      // Continue with the response even if cron restart fails
    }

    // Respond with success
    res.status(201).json({
      message: `User '${username}' added successfully`,
      user: newUser
    });
  } catch (error) {
    console.error('Error in /adduser endpoint:', error);
    res.status(500).json({ error: 'Failed to add user', details: error.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
    const scraper = new TwitterScraper();
    try {
        await scraper.loadConfig();
        res.json({ users: scraper.config.users || [] });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// Delete a user
app.delete('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    const scraper = new TwitterScraper();

    try {
        await scraper.loadConfig();
        
        // Find user index
        const userIndex = scraper.config.users.findIndex(u => u.username === username);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove user
        scraper.config.users.splice(userIndex, 1);
        await scraper.saveConfig();
        
        res.json({ success: true, message: `User '${username}' removed successfully` });
    } catch (error) {
        console.error(`Error deleting user ${username}:`, error);
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// Endpoint to fetch tweets for a username
app.get('/api/tweets/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Path to the JSON file - using storejson/{username}.json structure
    const filePath = path.join(__dirname, 'storejson', `${username}.json`);
    
    // Read and parse the JSON file
    const data = await fs.readFile(filePath, 'utf8');
    const tweets = JSON.parse(data);
    
    res.json({ success: true, tweets });
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tweets', 
      details: error.message 
    });
  }
});

// Serve the main HTML file at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server and initial cron job
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  
  try {
    await restartCronJob();
  } catch (error) {
    console.error('Failed to start initial cron job:', error);
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Kill cron job if running
  if (cronProcess) {
    console.log('Stopping cron job...');
    cronProcess.kill();
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (cronProcess) {
    cronProcess.kill();
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (cronProcess) {
    cronProcess.kill();
  }
  process.exit(1);
});

console.log(`API endpoint: http://localhost:${port}/api/tweets/:username`);

// Export the app for potential testing or further use
export default app;

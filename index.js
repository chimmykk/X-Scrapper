import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  async ensureDirectories() {
    const dirs = [this.config.storageFolder.csv, this.config.storageFolder.json];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (_) {}
    }
  }

  formatTimestamp(date) {
    return date.toISOString().replace(/:/g, '%3A').replace(/\./g, '_');
  }

  parseTimestamp(timestampStr) {
    return timestampStr.replace(/%3A/g, ':').replace(/_/g, '.');
  }

  async fetchTweets(username, sinceTimestamp, cursor = null) {
    const baseUrl = 'https://api.twitterapi.io/twitter/tweet/advanced_search';
    const queryParams = new URLSearchParams({
      queryType: 'Latest',
      query: `from:${username} since:${sinceTimestamp}`
    });

    if (cursor) {
      queryParams.append('cursor', cursor);
    }

    const url = `${baseUrl}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching tweets for ${username}:`, error);
      throw error;
    }
  }

  async loadExistingData(username, format) {
    const folder = this.config.storageFolder[format];
    const ext = format === 'json' ? 'json' : 'csv';
    const file = path.join(folder, `${username}.${ext}`);

    try {
      if (format === 'json') {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
      } else {
        return null;
      }
    } catch (_) {
      return format === 'json' ? [] : null;
    }
  }

  async saveData(username, tweets, format) {
    const folder = path.join(__dirname, this.config.storageFolder[format]);
    const ext = format === 'json' ? 'json' : 'csv';
    const filepath = path.join(folder, `${username}.${ext}`);

    // Ensure directory exists
    await fs.mkdir(folder, { recursive: true });

    if (format === 'json') {
      const existing = await this.loadExistingData(username, 'json');
      const combined = [...existing, ...tweets];
      await fs.writeFile(filepath, JSON.stringify(combined, null, 2));
    } else {
      await this.saveToCsv(filepath, tweets);
    }
  }

  async saveToCsv(filepath, tweets) {
    const headers = [
      'id', 'url', 'text', 'source', 'retweetCount', 'replyCount', 'likeCount',
      'quoteCount', 'viewCount', 'createdAt', 'lang', 'bookmarkCount', 'isReply',
      'inReplyToId', 'conversationId', 'authorUserName', 'authorName', 
      'authorFollowers', 'authorFollowing', 'authorDescription'
    ];

    let fileExists = false;
    try {
      await fs.access(filepath);
      fileExists = true;
    } catch (_) {}

    let csv = '';
    if (!fileExists) {
      csv += headers.join(',') + '\n';
    }

    for (const tweet of tweets) {
      const row = [
        `"${tweet.id || ''}"`,
        `"${tweet.url || ''}"`,
        `"${(tweet.text || '').replace(/"/g, '""')}"`,
        `"${tweet.source || ''}"`,
        tweet.retweetCount || 0,
        tweet.replyCount || 0,
        tweet.likeCount || 0,
        tweet.quoteCount || 0,
        tweet.viewCount || 0,
        `"${tweet.createdAt || ''}"`,
        `"${tweet.lang || ''}"`,
        tweet.bookmarkCount || 0,
        tweet.isReply || false,
        `"${tweet.inReplyToId || ''}"`,
        `"${tweet.conversationId || ''}"`,
        `"${tweet.author?.userName || ''}"`,
        `"${tweet.author?.name || ''}"`,
        tweet.author?.followers || 0,
        tweet.author?.following || 0,
        `"${(tweet.author?.description || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    }

    await fs.appendFile(filepath, csv);
  }

  async scrapeUser(userConfig) {
    const { username } = userConfig;
    console.log(`\nScraping tweets for: ${username}`);

    let since = userConfig.lastTimestampScrape;
    if (!since) {
      const now = new Date();
      since = this.formatTimestamp(now);
      console.log(`First time scraping ${username}, using: ${this.parseTimestamp(since)}`);
    }

    let allTweets = [];
    let cursor = null;
    let pageCount = 0;
    let latestTimestamp = null;

    try {
      while (pageCount < this.config.maxPages) {
        console.log(`Fetching page ${pageCount + 1}...`);
        const response = await this.fetchTweets(username, since, cursor);

        if (!response.tweets || response.tweets.length === 0) break;

        const newTweets = response.tweets.filter(tweet => {
          if (!userConfig.lastTimestampScrape) return true;
          return new Date(tweet.createdAt) > new Date(this.parseTimestamp(userConfig.lastTimestampScrape));
        });

        if (newTweets.length === 0) break;

        allTweets.push(...newTweets);

        for (const tweet of newTweets) {
          const tweetDate = new Date(tweet.createdAt);
          if (!latestTimestamp || tweetDate > new Date(this.parseTimestamp(latestTimestamp))) {
            latestTimestamp = this.formatTimestamp(tweetDate);
          }
        }


        if (!response.has_next_page || !response.next_cursor) break;

        cursor = response.next_cursor;
        pageCount++;
        await new Promise(res => setTimeout(res, 1000)); // Delay
      }

      if (allTweets.length > 0) {
        await this.saveData(username, allTweets, 'json');
        await this.saveData(username, allTweets, 'csv');
        userConfig.lastTimestampScrape = latestTimestamp || since;
        console.log(`Saved ${allTweets.length} tweets for ${username}`);
      } else {
        console.log(`No new tweets for ${username}`);
      }

    } catch (err) {
      console.error(`Failed to scrape ${username}:`, err);
    }
  }

  async scrapeAll() {
    await this.loadConfig();
    await this.ensureDirectories();

    for (const user of this.config.users) {
      await this.scrapeUser(user);
    }

    await this.saveConfig();
    console.log('✅ Scraping complete. Config updated.');
  }
}

// Main function to run the scraper
export async function runScraper(configPath = 'config.json') {
  try {
    const scraper = new TwitterScraper(configPath);
    await scraper.scrapeAll();
  } catch (error) {
    console.error('❌ Error running scraper:', error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const configPath = process.argv[2] || 'config.json';
  runScraper(configPath).catch(console.error);
}

export default TwitterScraper;

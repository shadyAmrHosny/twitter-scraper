/**
 * Twitter Stock Symbol Scraper
 *
 * This script scrapes specified Twitter accounts for mentions of stock symbols.
 * It uses Puppeteer to navigate to each account, scrolls to load tweets, and counts
 * occurrences of given stock symbols. The script runs at specified intervals
 * and logs the results.
 *
 */

import puppeteer from 'puppeteer'; // Import Puppeteer for web scraping

// Function to scrape Twitter accounts for stock symbol mentions
async function scrapeTwitter(accounts, tickers, interval) {
    const browser = await puppeteer.launch({ headless: false }); // Launch browser
    const page = await browser.newPage(); // Open a new browser page

    // Loop through each Twitter account
    for (const account of accounts) {
        try {
            console.log(`Scraping Twitter account: ${account}`);
            await page.goto(account, { waitUntil: 'networkidle2' }); // Go to the account page

            let tweetsData = []; // Store tweets and timestamps
            let lastHeight = await page.evaluate('document.body.scrollHeight'); // Get initial scroll height
            let scrollAttempts = 0; // Track number of scrolls

            // Scroll and load tweets until limit is reached
            while (tweetsData.length < 100 && scrollAttempts < 20) {
                // Get tweets text and timestamps
                let newTweets = await page.evaluate(() => {
                    const tweetElements = Array.from(document.querySelectorAll('article'));
                    return tweetElements.map(tweet => {
                        const tweetText = tweet.innerText;
                        const timestamp = tweet.querySelector('time')?.getAttribute('datetime') || 'No timestamp';
                        return { text: tweetText, timestamp: timestamp };
                    });
                });

                // Add unique tweets to the data array
                newTweets.forEach(newTweet => {
                    if (!tweetsData.find(t => t.text === newTweet.text && t.timestamp === newTweet.timestamp)) {
                        tweetsData.push(newTweet);
                    }
                });

                console.log(`Loaded ${tweetsData.length} tweets so far...`);

                // Scroll down to load more tweets
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                await new Promise(r => setTimeout(r, 2000)); // Wait for tweets to load

                let newHeight = await page.evaluate('document.body.scrollHeight'); // Check new height
                if (newHeight === lastHeight) {
                    scrollAttempts++; // Increment if no new tweets loaded
                    if (scrollAttempts >= 3) { // Stop after a few tries
                        break;
                    }
                } else {
                    scrollAttempts = 0; // Reset if new tweets are found
                }
                lastHeight = newHeight;
            }

            // Log each tweet and its timestamp
            tweetsData.forEach(tweet => {
                console.log(tweet);
            });

            // Count mentions of each ticker symbol
            let tickerCounts = {};
            tickers.forEach(ticker => {
                tickerCounts[ticker] = 0;
            });

            tweetsData.forEach(tweet => {
                tickers.forEach(ticker => {
                    if (tweet.text.includes(ticker)) {
                        tickerCounts[ticker]++; // Count ticker mentions
                    }
                });
            });

            // Log ticker counts for this account
            console.log(`Symbol mentions for ${account}:`, tickerCounts);

        } catch (error) {
            console.error(`Failed to scrape ${account}:`, error); // Log any errors
        }
    }

    await browser.close(); // Close the browser
}

// List of Twitter accounts to scrape
const accounts = [
    'https://twitter.com/Mr_Derivatives',
    'https://twitter.com/warrior_0719',
    'https://twitter.com/ChartingProdigy',
    'https://twitter.com/allstarcharts',
    'https://twitter.com/yuriymatso',
    'https://twitter.com/TriggerTrades',
    'https://twitter.com/AdamMancini4',
    'https://twitter.com/CordovaTrades',
    'https://twitter.com/Barchart',
    'https://twitter.com/RoyLMatttox'
];

// List of stock symbols (tickers) to search for
const tickers = ['$TSLA', '$SOFI', '$AAPL'];

const interval = 15; // Time interval in minutes

// Schedule the scraping to run at the defined interval
const scrapeInterval = interval * 60 * 1000; // Convert minutes to milliseconds

// Run the scraper at regular intervals
setInterval(() => {
    scrapeTwitter(accounts, tickers, interval);
}, scrapeInterval);

// Run the scraper immediately when the script starts
scrapeTwitter(accounts, tickers, interval);

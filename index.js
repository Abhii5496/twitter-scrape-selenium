const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const express = require("express");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const proxyChain = require("proxy-chain");

const app = express();
const port = 3000;

// MongoDB connection string
const mongoUrl = "mongodb://localhost:27017";
const dbName = "twitter_trends";

// ProxyMesh configuration
const PROXY_HOST = "usisp.proxymesh.com";
const PROXY_PORT = "31280";
const PROXY_USER = "abhii5496";
const PROXY_PASS = "Abhii@8726";

// Retry configuration
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5 seconds

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const oldProxyUrl = `http://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}`;

async function scrapeTrendsWithRetry() {
  let attempts = 0;
  let lastError;

  while (attempts < MAX_RETRIES) {
    try {
      const result = await scrapeTrends();
      console.log(`Successfully scraped trends on attempt ${attempts + 1}`);
      return result;
    } catch (error) {
      attempts++;
      lastError = error;
      console.error(`Attempt ${attempts} failed: ${error.message}`);

      if (attempts < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  throw new Error(
    `Failed after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`
  );
}

async function scrapeTrends() {
  let driver;

  const newProxyUrl = await proxyChain.anonymizeProxy({ url: oldProxyUrl });
  try {
    let options = new chrome.Options();
    //   options.addArguments(`--proxy-server=${proxyHost}:${proxyPort}`);
    options.addArguments(`--proxy-server=${newProxyUrl}`);

    const driver = new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("newProxyUrl", newProxyUrl, oldProxyUrl);

    await driver.get("https://twitter.com/login");

    await driver.wait(until.elementLocated(By.name("text")), 100000);
    await driver.findElement(By.name("text")).sendKeys("abhii5496");

    await driver.findElement(By.xpath("//span[text()='Next']")).click();

    await driver.wait(until.elementLocated(By.name("password")), 100000);
    await driver.findElement(By.name("password")).sendKeys("Abhii@726");

    await driver.findElement(By.xpath("//span[text()='Log in']")).click();

    // Wait for trends to load
    await driver.wait(
      until.elementLocated(By.xpath('//div[text()="What\'s happening"]')),
      10000
    );

    const trendElements = await driver.findElements(
      By.xpath("//div[@data-testid='trend']")
    );
    const trends = [];

    for (let i = 0; i < 5 && i < trendElements.length; i++) {
      const trendText = await trendElements[i].getText();
      trends.push(trendText.split("\n")[0]);
    }

    // Create document for MongoDB
    const document = {
      _id: uuidv4(),
      nameoftrend1: trends[0],
      nameoftrend2: trends[1],
      nameoftrend3: trends[2],
      nameoftrend4: trends[3],
      nameoftrend5: trends[4],
      timestamp: new Date(),
      ip_address: newProxyUrl,
    };

    // Store in MongoDB
    const client = await MongoClient.connect(mongoUrl);
    const db = client.db(dbName);
    await db.collection("trends").insertOne(document);
    await client.close();

    return document;
  } finally {
    if (driver) {
      await driver.quit();
    }
    if (newProxyUrl) {
      await proxyChain.closeAnonymizedProxy(newProxyUrl);
    }
  }
}

// HTML template
const HTML_TEMPLATE = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Twitter Trends Scraper</title>
      <style>
          body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.6;
          }
          .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #1DA1F2;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
          }
          .trends {
              margin: 20px 0;
          }
          .json {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              font-family: monospace;
          }
      </style>
  </head>
  <body>
      <h1>Twitter Trends Scraper</h1>
      <a href="/scrape" class="button">Click here to run the script</a>
      {{content}}
  </body>
  </html>
  `;

// Routes
app.get("/", async (req, res) => {
  // res.send(HTML_TEMPLATE.replace("{{content}}", ""));
  try {
    const result = await scrapeTrendsWithRetry();
    console.log(result);
  } catch (error) {
    console.log("error:", error);
  }
});

app.get("/scrape", async (req, res) => {
  try {
    const result = await scrapeTrendsWithRetry();

    const content = `
              <div class="trends">
                  <h2>These are the most happening topics as on ${
                    result.timestamp
                  }</h2>
                  <ul>
                      <li>${result.nameoftrend1}</li>
                      <li>${result.nameoftrend2}</li>
                      <li>${result.nameoftrend3}</li>
                      <li>${result.nameoftrend4}</li>
                      <li>${result.nameoftrend5}</li>
                  </ul>
                  <p>The IP address used for this query was ${
                    result.ip_address
                  }</p>
                  <div class="json">
                      <pre>${JSON.stringify(result, null, 2)}</pre>
                  </div>
              </div>
              <a href="/scrape" class="button">Click here to run the query again</a>
          `;

    res.send(HTML_TEMPLATE.replace("{{content}}", content));
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

// Twitter credentials
const TWITTER_EMAIL = "your_email@example.com";
const TWITTER_PASSWORD = "your_password";

// ProxyMesh credentials
const PROXY_USERNAME = "abhii5496";
const PROXY_PASSWORD = "abhii8726";

// Your ProxyMesh proxies
const proxies = [
  "us-ca.proxymesh.com:31280",
  "jp.proxymesh.com:31280",
  "us-wa.proxymesh.com:31280",
  "nl.proxymesh.com:31280",
];

// Configuration
const MAX_RETRIES = 3;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to get a random proxy from the list
function getRandomProxy() {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

// Main login function
async function loginToTwitter() {
  let driver;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      // Get a random proxy
      const proxy = getRandomProxy();
      console.log(`Attempt ${attempts + 1}: Using proxy ${proxy}`);

      // Configure Chrome options with authentication
      const proxyHost = "20.205.61.143";
      const proxyPort = "8123";

      // Configure Chrome options with proxy settings
      let options = new chrome.Options();
      options.addArguments(`--proxy-server=${proxyHost}:${proxyPort}`);
      // console.log("proxyString", proxyString);
      // options.addArguments(`--proxy-server=${proxyString}`);
      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");

      // Initialize WebDriver
      driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

      try {
        console.log("Navigating to Twitter login page...");
        await driver.get("https://twitter.com/login");

        // Wait for and enter email
        console.log("Entering email...");
        const emailInput = await driver.wait(
          until.elementLocated(By.name("text")),
          100009
        );
        await emailInput.sendKeys(TWITTER_EMAIL);

        // Click Next
        console.log("Clicking Next...");
        const nextButton = await driver.findElement(
          By.xpath("//span[text()='Next']")
        );
        await nextButton.click();

        // Wait for and enter password
        console.log("Entering password...");
        const passwordInput = await driver.wait(
          until.elementLocated(By.name("password")),
          10000
        );
        await passwordInput.sendKeys(TWITTER_PASSWORD);

        // Click Login
        console.log("Clicking Login...");
        const loginButton = await driver.findElement(
          By.xpath("//span[text()='Log in']")
        );
        await loginButton.click();

        // Wait for login to complete
        console.log("Waiting for login to complete...");
        await driver.wait(
          until.elementLocated(By.css('[data-testid="AppTabBar_Home_Link"]')),
          15000
        );

        console.log("Successfully logged in to Twitter!");

        return true;
      } catch (error) {
        console.error(`Error during login process: ${error.message}`);
        // Take screenshot of error state
        throw error;
      } finally {
        if (driver) {
          await driver.quit();
        }
      }
    } catch (error) {
      console.error(
        `Login attempt ${attempts + 1} failed with proxy ${proxy}:`,
        error.message
      );
      attempts++;

      if (attempts < MAX_RETRIES) {
        console.log(`Waiting 5 seconds before retrying...`);
        await sleep(5000);
      }
    }
  }

  throw new Error(`Failed to login after ${MAX_RETRIES} attempts`);
}

// Error handler
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
async function main() {
  try {
    await loginToTwitter();
  } catch (error) {
    console.error("Login failed:", error.message);
  } finally {
    process.exit();
  }
}

// Start the script
console.log("Starting Twitter login automation...");
main();

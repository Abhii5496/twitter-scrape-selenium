const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const proxyChain = require("proxy-chain");

const proxyHost = "20.205.61.143";
const proxyPort = "8123";

const oldProxyUrl = "http://abhii5496:abhii8726@sg.proxymesh.com:31280";
// Configure Chrome options with proxy settings

async function getIp() {
  let attempt = 0;
  const maxAttempts = 4;
  const url = "https://whatismyipaddress.com/";
  // const url = "https://twitter.com/login";
  const newProxyUrl = await proxyChain.anonymizeProxy({ url: oldProxyUrl });

  let options = new chrome.Options();
  //   options.addArguments(`--proxy-server=${proxyHost}:${proxyPort}`);
  options.addArguments(`--proxy-server=${newProxyUrl}`);

  const driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  console.log("newProxyUrl", newProxyUrl, oldProxyUrl);

  while (attempt < maxAttempts) {
    try {
      console.log(`Attempt ${attempt + 1}: Navigating to ${url}`);
      await driver.get(url);

      // Wait for the page to load (if needed, adjust wait logic as per the website structure)
      await driver.wait(until.elementLocated(By.tagName("body")), 10000);

      try {
        const tryAgainButton = await driver.wait(
          until.elementLocated(
            By.xpath("//button[contains(text(), 'Try Again')]")
          ),
          5000 // Wait for up to 5 seconds
        );

        console.log("Try Again button found. Clicking it...");
        await tryAgainButton.click();
      } catch (error) {
        console.log("No 'Try Again' button found or no error occurred.");
      }
      await driver.wait(until.elementLocated(By.name("text")), 10000);
      await driver.findElement(By.name("text")).sendKeys("abhii5496");

      await driver.findElement(By.xpath("//span[text()='Next']")).click();

      await driver.wait(until.elementLocated(By.name("password")), 10000);
      await driver.findElement(By.name("password")).sendKeys("Abhii@726");

      await driver.findElement(By.xpath("//span[text()='Log in']")).click();

      // Wait for trends to load
      await driver.wait(
        until.elementLocated(By.xpath('//div[text()="What\'s happening"]')),
        10000
      );
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error.message);
      attempt++;
    }
  }

  if (attempt === maxAttempts) {
    console.error("Failed to access the website after multiple attempts.");
  }
}

// Run the function
getIp();

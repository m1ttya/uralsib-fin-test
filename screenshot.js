const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: 'landing-page-screenshot.png', fullPage: true });
  await browser.close();
})();

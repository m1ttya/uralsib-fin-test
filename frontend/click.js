const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  await page.click('button:has-text("Пройти тест")');
  await page.waitForSelector('text=Вход в Уралсиб');
  await page.click('button:has-text("Пропустить")');
  await page.screenshot({ path: 'test-flow.png' });
  await browser.close();
})();

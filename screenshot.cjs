const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:4173');
  await new Promise(r => setTimeout(r, 2000));
  await page.mouse.click(640, 400); 
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => { document.querySelectorAll('.csd-tab')[1].click(); });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'drawer-test.png'});
  await browser.close();
  console.log('done');
})();

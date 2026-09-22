const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://evenly-eight.vercel.app/group/7609908e44da4247b9e3309737e9a9e9', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Go to root to set local storage
  await page.goto('https://evenly-eight.vercel.app/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('token', 'dummy');
    localStorage.setItem('user', JSON.stringify({ id: 'dummy', name: 'Dummy' }));
  });
  
  await page.goto('https://evenly-eight.vercel.app/group/7609908e44da4247b9e3309737e9a9e9', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();

import puppeteer from 'puppeteer';
import fs from 'fs';

const test = async () => {
  const logFile = 'pdf-debug.log';
  const log = (msg) => {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    console.log(formattedMsg);
    fs.appendFileSync(logFile, formattedMsg + '\n');
  };

  if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

  log('--- Starting Puppeteer Debug Test ---');
  let browser = null;
  try {
    log('Puppeteer version: ' + (await import('puppeteer/package.json', { assert: { type: 'json' } })).default.version);
    
    log('Launching browser with headless: "new"...');
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    log('Browser launched successfully!');

    log('Opening new page...');
    const page = await browser.newPage();
    
    log('Setting content...');
    await page.setContent('<h1>Boonraksa PDF Test</h1><p>If you see this, Puppeteer is working correctly.</p>', { waitUntil: 'domcontentloaded' });

    log('Generating PDF...');
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    
    log(`Job Done! PDF Size: ${pdf.length} bytes`);
    fs.writeFileSync('debug-result.pdf', pdf);
    log('Saved to debug-result.pdf');

  } catch (err) {
    log('!!! FATAL ERROR !!!');
    log('Message: ' + err.message);
    log('Stack: ' + err.stack);
  } finally {
    if (browser) {
      log('Closing browser...');
      try {
        await browser.close();
        log('Browser closed.');
      } catch (closeErr) {
        log('Error closing browser: ' + closeErr.message);
      }
    }
  }
};

test();

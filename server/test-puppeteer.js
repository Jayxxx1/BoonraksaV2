import puppeteer from 'puppeteer';

const test = async () => {
  console.log('Testing Puppeteer launch...');
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent('<h1>Puppeteer Test</h1><p>If you see this, generation works.</p>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('SUCCESS: PDF generated, size:', pdf.length);
  } catch (err) {
    console.error('FAILURE:', err);
  } finally {
    if (browser) await browser.close();
  }
};

test();

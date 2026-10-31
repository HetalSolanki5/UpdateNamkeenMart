import puppeteer from 'puppeteer';
import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Converts an HTML string into a PDF Buffer using Puppeteer
 * @param {string} html Raw HTML string
 * @returns {Promise<Buffer>} PDF file buffer
 */
export const htmlToPdfBuffer = async (html) => {
  let browser = null;
  let tempUserDataDir = null;

  try {
    // Generate a unique isolated temporary user-data-dir to avoid profile locks on Windows
    tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-pup-'));

    browser = await puppeteer.launch({
      headless: true,
      userDataDir: tempUserDataDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (tempUserDataDir) {
      try {
        fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      } catch (rmErr) {
        // Silently ignore temp cleanup errors
      }
    }
  }
};

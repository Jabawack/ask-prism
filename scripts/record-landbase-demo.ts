#!/usr/bin/env npx tsx
/**
 * Record Landbase Table Demo Video
 *
 * Usage:
 *   npx tsx scripts/record-landbase-demo.ts
 *
 * Requires:
 *   - ffmpeg installed: brew install ffmpeg
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const URL = 'https://ask-prism.vercel.app/landbase-table';
const OUTPUT_DIR = '/Users/tk/code/jabawack.github.io/public/images/blog/landbase-table-demo';
const OUTPUT_NAME = 'landbase-table-demo';

async function recordDemo(): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });

  // Create recording context
  const tempDir = fs.mkdtempSync(path.join(OUTPUT_DIR, '.recording-'));
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: { dir: tempDir, size: { width: 1400, height: 900 } },
  });

  const page = await context.newPage();
  console.log('Recording Landbase Table Demo...');
  console.log(`  URL: ${URL}`);

  // Navigate to page
  await page.goto(URL, { waitUntil: 'networkidle' });
  console.log('  Page loaded, waiting for initial render...');

  // Wait for page to fully render
  await page.waitForTimeout(2000);

  // Helper to scroll table to the right to show new columns
  const scrollTableRight = async () => {
    await page.evaluate(() => {
      const tableContainer = document.querySelector('.overflow-x-auto');
      if (tableContainer) {
        tableContainer.scrollLeft = tableContainer.scrollWidth;
      }
    });
  };

  // Click "recent funding rounds" button
  console.log('  Clicking "recent funding rounds"...');
  await page.click('button:has-text("recent funding rounds")');

  // Wait for header to appear, then scroll so we can watch cells populate
  await page.waitForTimeout(2500);
  await scrollTableRight();
  await page.waitForTimeout(12500);

  // Click "their tech stack" button
  console.log('  Clicking "their tech stack"...');
  await page.click('button:has-text("their tech stack")');

  // Wait for header to appear, then scroll so we can watch cells populate
  await page.waitForTimeout(2500);
  await scrollTableRight();
  await page.waitForTimeout(12500);

  // Click "employee count" button
  console.log('  Clicking "employee count"...');
  await page.click('button:has-text("employee count")');

  // Wait for header to appear, then scroll so we can watch cells populate
  await page.waitForTimeout(2500);
  await scrollTableRight();
  await page.waitForTimeout(12500);

  // Final pause to show completed table
  console.log('  Showing final result...');
  await page.waitForTimeout(10000);

  // Close context to stop recording
  await context.close();
  await browser.close();

  // Find and convert the recorded webm to mp4
  const webmFiles = fs.readdirSync(tempDir).filter((f) => f.endsWith('.webm'));
  if (!webmFiles.length) throw new Error('No video recorded');

  const webmPath = path.join(tempDir, webmFiles[0]);
  const mp4Path = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.mp4`);

  console.log('  Converting to MP4...');
  execSync(
    `ffmpeg -y -i "${webmPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Path}"`,
    { stdio: 'pipe' }
  );

  // Cleanup temp directory
  fs.rmSync(tempDir, { recursive: true });

  const stats = fs.statSync(mp4Path);
  console.log(`\nDone! Video saved to: ${mp4Path}`);
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
}

recordDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});

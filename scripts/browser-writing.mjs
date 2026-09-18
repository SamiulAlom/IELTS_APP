import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const baseURL = process.env.BROWSER_TEST_URL || 'http://127.0.0.1:3101';
await mkdir('.runtime/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1050 } });
const page = await context.newPage(); page.setDefaultTimeout(30000);
const errors = []; page.on('pageerror', error => errors.push(error.message));
const status = () => page.getByRole('status');
try {
  const prompts = await (await context.request.get('/api/practice/writing')).json();
  expect(prompts).toHaveLength(14);
  for (const id of ['writing-cycling-line','writing-leisure-bar','writing-energy-pie','writing-paper-process','writing-park-map','writing-museum-mixed']) {
    await page.goto(`/writing?id=${id}`);
    await expect(page.locator('.writing-visual').first()).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), id).toBe(false);
    await page.setViewportSize({ width: 1440, height: 1050 });
  }
  await page.goto('/writing?id=writing-cycling-line');
  await page.getByRole('textbox', { name: 'Overview: main features', exact: true }).fill('North grew fastest and became the leader.');
  await page.getByRole('textbox', { name: 'Draft', exact: true }).fill('Existing opening paragraph.');
  await page.getByRole('button', { name: 'Append plan to draft', exact: true }).click();
  await expect(status()).toContainText('Draft, plan and self-check saved');
  await expect(page.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue('Existing opening paragraph.\n\nNorth grew fastest and became the leader.');
  const url = page.url();
  expect(new URL(url).searchParams.get('attempt')).toBeTruthy();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Overview: main features', exact: true })).toHaveValue('North grew fastest and became the leader.');
  await page.getByText('Compare teaching samples', { exact: true }).click();
  await page.getByLabel('Sample version').selectOption('0');
  await expect(page.locator('.prose')).toContainText('North went up a lot');
  await page.getByLabel('Sample version').selectOption('2');
  await expect(page.locator('.prose')).toContainText('North experienced the strongest growth');
  await page.screenshot({ path: '.runtime/screenshots/writing-studio-desktop.png', fullPage: true, animations: 'disabled' });

  let fail = true;
  await page.route('**/api/practice/writing', async route => {
    if (fail && route.request().method() === 'POST') await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Test save unavailable.' }) });
    else await route.continue();
  });
  await page.getByRole('textbox', { name: 'Draft', exact: true }).fill('Unsaved text stays here during a failed save.');
  await expect(page.locator('.notice.error')).toContainText('Test save unavailable');
  await page.getByRole('link', { name: 'Phrase bank', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue('Unsaved text stays here during a failed save.');
  fail = false;
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(status()).toContainText('Draft, plan and self-check saved');
  await page.unroute('**/api/practice/writing');

  const stale = await context.newPage();
  await stale.goto(page.url());
  await expect(stale.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue('Unsaved text stays here during a failed save.');
  await page.getByRole('textbox', { name: 'Draft', exact: true }).fill('Newer saved version from the first tab.');
  await expect(status()).toContainText('Draft, plan and self-check saved');
  await stale.getByRole('textbox', { name: 'Draft', exact: true }).fill('Older tab must not overwrite the newer draft.');
  await expect(stale.locator('.notice.error')).toContainText('newer version');
  await expect(stale.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue('Older tab must not overwrite the newer draft.');
  await stale.close();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue('Newer saved version from the first tab.');

  // Enter via a client-side link, then go Back immediately after the first edit.
  await page.goto('/reading');
  await page.getByRole('link', { name: 'Writing', exact: true }).click();
  await page.getByRole('button', { name: 'New draft', exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Draft', exact: true }).fill('First keystrokes saved when navigating back.');
  await page.goBack();
  await expect(page).toHaveURL(/\/reading$/);
  await page.goForward();
  await expect(page.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue('First keystrokes saved when navigating back.');
  await page.getByRole('link', { name: 'My essays', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Every saved draft' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reopen', exact: true }).first()).toBeVisible();

  await page.goto('/writing?tab=phrases');
  await page.getByLabel('Phrase task').selectOption('TASK_1');
  await page.getByLabel('Phrase category').selectOption('Proportion');
  await expect(page.getByRole('heading', { name: 'accounted for', exact: true })).toBeVisible();
  await page.getByLabel('Search phrases').fill('অংশ');
  await expect(page.getByRole('status')).toContainText('1 useful expressions');

  await page.goto('/writing?tab=sentences');
  await page.getByLabel('Sentence exercise').selectOption('writing-sentence-change');
  await page.getByLabel('Your sentence', { exact: true }).fill('Cycling rose by twenty percentage points.');
  await page.getByLabel('What I want to improve').fill('Keep percentages and percentage points distinct.');
  await page.getByRole('button', { name: 'Save sentence', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Sentence and reflection saved');
  await expect(page.getByRole('heading', { name: 'Ways to express the idea' })).toBeVisible();
  await page.reload();
  await page.getByLabel('Sentence exercise').selectOption('writing-sentence-change');
  await expect(page.getByText('Cycling rose by twenty percentage points.', { exact: true }).first()).toBeVisible();

  const attemptId = new URL(url).searchParams.get('attempt');
  await page.goto(`/writing?tab=mistakes&attempt=${attemptId}`);
  await page.getByLabel('Original sentence', { exact: true }).fill('The figures was stable.');
  await page.getByLabel('Corrected sentence', { exact: true }).fill('The figures were stable.');
  await page.getByLabel('Mistake category', { exact: true }).selectOption('Agreement');
  await page.getByLabel('Why this correction works').fill('Figures is plural, so it needs were.');
  await page.getByRole('button', { name: 'Save mistake', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Writing mistake saved');
  const note = page.locator('article.panel').filter({ hasText: 'The figures was stable.' }).first();
  await note.getByRole('button', { name: 'Mark resolved', exact: true }).click();
  await expect(note).toContainText('Successful revisions: 1');
  await page.reload();
  await expect(note.getByRole('button', { name: 'Reopen', exact: true })).toBeVisible();
  await page.goto('/mistakes?module=WRITING&status=resolved');
  await expect(page.getByText('The figures were stable.', { exact: true }).first()).toBeVisible();
  await page.goto('/writing?tab=guide');
  await expect(page.getByRole('heading', { name: 'Lexical resource', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: '.runtime/screenshots/writing-guide-mobile.png', fullPage: true, animations: 'disabled' });
  await page.goto('/writing?tab=mock');
  await page.getByRole('button', { name: /Start timed practice|Resume timed practice/ }).click();
  await page.getByRole('textbox', { name: 'Mock Task 1 answer', exact: true }).fill('Cars remained the leading mode, while cycling increased.');
  await page.getByRole('textbox', { name: 'Mock Task 2 answer', exact: true }).fill('I favour reliable public transport while retaining essential road maintenance.');
  await expect(page.getByRole('status')).toContainText('Both tasks saved');
  const beforeReload = await page.getByLabel('Mock time remaining').textContent();
  await page.reload();
  await page.getByRole('button', { name: 'Resume timed practice', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Mock Task 1 answer', exact: true })).toHaveValue('Cars remained the leading mode, while cycling increased.');
  const afterReload = await page.getByLabel('Mock time remaining').textContent();
  const seconds = text => text.split(':').reduce((sum, n) => sum * 60 + Number(n), 0);
  expect(seconds(afterReload)).toBeLessThanOrEqual(seconds(beforeReload));
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Finish timed practice', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Timed attempt completed');
  await expect(page.getByRole('textbox', { name: 'Mock Task 1 answer', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
  console.log('PASS full writing: all visuals, planner, autosave/reload, failure recovery, stale-tab protection, Back/Forward, samples, phrases, sentences, notebook, criteria, timed mock and mobile.');
} catch (error) {
  console.error('WRITING FAILURE:', error.message.slice(0, 1800));
  console.error('PAGE STATUS:', await page.getByRole('status').allTextContents());
  await page.screenshot({ path: '.runtime/screenshots/writing-failure.png', fullPage: true, animations: 'disabled' });
  throw error;
} finally { await browser.close(); }

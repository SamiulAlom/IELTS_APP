import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.BROWSER_TEST_URL || "http://127.0.0.1:3101";
await mkdir(".runtime/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1050 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));

try {
  await page.goto("/vocabulary");
  await expect(page.getByRole("status")).toContainText("500 words");
  const seen = new Set();
  for (let current = 1; current <= 28; current++) {
    // The page number changes immediately; wait for the fetched cards as well.
    await expect(page.getByRole("status")).toContainText(`showing ${(current - 1) * 18 + 1}–${Math.min(current * 18, 500)}`);
    await expect(page.locator(".pagination span")).toHaveText(`${current} / 28`);
    await expect(page.locator(".word-card")).toHaveCount(current === 28 ? 14 : 18);
    for (const word of await page.locator(".word-card h3").allTextContents()) {
      expect(seen.has(word), `Word repeated on page ${current}: ${word}`).toBe(false);
      seen.add(word);
    }
    if (current < 28) await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  expect(seen.size).toBe(500);
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("487–500");
  await page.screenshot({ path: ".runtime/screenshots/vocabulary-500-last-page.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator(".pagination span")).toHaveText("27 / 28");
  await page.getByLabel("Filter vocabulary category").selectOption("Academic");
  await expect(page.getByRole("status")).toContainText("50 words");
  await expect(page.locator(".pagination span")).toHaveText("1 / 3");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("500 words");
  await page.getByLabel("Search vocabulary").fill("empirical");
  await expect(page.locator(".word-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "empirical", exact: true })).toBeVisible();
  await page.locator(".word-card summary").click();
  await expect(page.locator(".word-card details")).toContainText("Education reforms should be informed by empirical evidence from classrooms.");
  await page.getByLabel("Search vocabulary").fill("নগরায়ণ");
  await expect(page.locator(".word-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "urbanisation", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({ path: ".runtime/screenshots/vocabulary-500-bangla-search.png", fullPage: true, animations: "disabled" });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ wordBank: "passed", uniqueWordsAcrossPages: seen.size, pages: 28, lastPage: 14, categoryTotal: 50, search: "English and Bangla", mobileOverflow: false }));
} finally { await browser.close(); }

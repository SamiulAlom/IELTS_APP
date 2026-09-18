import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync(".runtime/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".runtime/screenshots/dashboard-desktop.png", fullPage: true, animations: "disabled" });
  console.log(JSON.stringify({ title: await page.title(), heading: await page.locator("h1").innerText(), desktopOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), errors }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".runtime/screenshots/dashboard-mobile.png", fullPage: true, animations: "disabled" });
  console.log(JSON.stringify({ mobileOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth) }));
  for (const route of ["/vocabulary", "/vocabulary/learn", "/vocabulary/quiz", "/vocabulary/history", "/vocabulary/review", "/settings", "/today", "/progress", "/mistakes", "/reading", "/writing", "/speaking", "/grammar", "/resources", "/search?q=education", "/mock-tests"]) {
    const response = await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: "networkidle" });
    console.log(JSON.stringify({ route, status: response.status(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), heading: await page.locator("h1").first().textContent(), errors: [...errors] }));
  }
} finally { await browser.close(); }

import { chromium, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = "http://127.0.0.1:3101";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => { errors.push(error.message); console.error(page.url(), error.stack); });
page.setDefaultTimeout(30000);
mkdirSync(".runtime/screenshots", { recursive: true });
let session;
try {
  const started = await context.request.post("/api/vocabulary/sessions", { data: { source: "learned", size: 2 } });
  expect(started.ok()).toBe(true);
  ({ session } = await started.json());
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Continue my session" })).toHaveAttribute("href", `/vocabulary/learn?session=${session.id}`);
  await expect(page.getByRole("link", { name: "Learn 20 words", exact: true })).toHaveAttribute("href", "/vocabulary/learn?size=20");
  await expect(page.getByRole("link", { name: "Learn 30 words", exact: true })).toHaveAttribute("href", "/vocabulary/learn?size=30");
  console.log("PASS dashboard: existing session and direct study shortcuts");

  await page.setViewportSize({ width: 390, height: 844 });
  const quickNav = page.getByRole("navigation", { name: "Quick navigation" });
  await expect(quickNav).toBeVisible();
  const more = page.getByRole("button", { name: "More navigation" });
  await more.click();
  const drawer = page.getByRole("dialog", { name: "Main navigation" });
  await expect(drawer).toHaveAttribute("aria-modal", "true");
  await expect(page.locator(".main-shell")).toHaveAttribute("inert", "");
  await expect(drawer.getByRole("button", { name: "Close menu" })).toBeFocused();
  await drawer.locator("a").last().focus();
  await page.keyboard.press("Tab");
  await expect(drawer.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#primary-navigation")).toHaveAttribute("inert", "");
  await expect(more).toBeFocused();
  await expect(page.locator(".main-shell")).not.toHaveAttribute("inert", "");
  await page.screenshot({ path: ".runtime/screenshots/dashboard-mobile-viewport.png", animations: "disabled", caret: "initial" });
  await more.click();
  await drawer.getByRole("link", { name: "Reading", exact: true }).click();
  await expect(page).toHaveURL(`${base}/reading`);
  await expect(page.locator("#primary-navigation")).toHaveAttribute("inert", "");
  console.log("PASS mobile: bottom navigation, focus trap, Escape, focus restoration, and route selection");

  await page.keyboard.press("Control+k");
  await expect(page).toHaveURL(`${base}/search`);
  await page.getByRole("textbox", { name: "Search library" }).fill("significant");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".search-result").first()).toContainText("significant");
  console.log("PASS keyboard search and results");
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Continue my session" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await page.screenshot({ path: ".runtime/screenshots/dashboard-dark-tablet.png", animations: "disabled", caret: "initial" });
  expect(errors).toEqual([]);
  console.log("PASS tablet layout and browser runtime checks");
} finally {
  if (session) for (const item of session.items.filter(item => !item.studiedAt)) {
    await context.request.patch(`/api/vocabulary/sessions/${session.id}`, { data: { wordId: item.wordId, rating: "LEARNING", timeSpentMs: 0 } });
  }
  await browser.close();
}

import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as playwrightExpect } from "@playwright/test";

// Run only against the isolated persistence-test server started on port 3101.
const base = "http://127.0.0.1:3101";
const expect = playwrightExpect.configure({ timeout: 30000 });
const output = ".runtime/browser-foundation";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(120000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const changedMistakes = new Set();
page.on("request", (request) => {
  if (request.method() === "PATCH" && request.url().includes("/api/mistakes/")) changedMistakes.add(request.url());
});
const originalResponse = await context.request.get(`${base}/api/settings`);
assert.equal(originalResponse.ok(), true);
const original = await originalResponse.json();
const restore = Object.fromEntries(Object.entries(original).filter(([key]) => !["userId", "createdAt", "updatedAt"].includes(key)));

try {
  await page.goto(`${base}/settings`);
  await expect(page.getByRole("heading", { name: "Your study preferences" })).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Foundation browser check");
  await page.getByLabel("Target band", { exact: true }).selectOption("8");
  await page.getByLabel("Listening", { exact: true }).selectOption("7");
  await page.getByLabel("Reading", { exact: true }).selectOption("7");
  await page.getByLabel("Writing", { exact: true }).selectOption("6.5");
  await page.getByLabel("Speaking", { exact: true }).selectOption("6.5");
  await page.getByLabel("Daily study target (minutes)", { exact: true }).fill("45");
  await page.getByLabel("Words per learning session", { exact: true }).fill("25");
  await page.getByLabel("Appearance").selectOption("dark");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("Preferences saved");
  const saved = await (await context.request.get(`${base}/api/settings`)).json();
  assert.equal(saved.name, "Foundation browser check");
  assert.equal(saved.targetBand, 8);
  assert.equal(saved.dailyStudyMinutes, 45);
  assert.equal(saved.vocabularySessionSize, 25);
  assert.equal(saved.theme, "dark");
  await page.reload();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Foundation browser check");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: `${output}/settings-desktop.png`, fullPage: true, caret: "initial" });
  console.log("Settings: saved fields and theme survived a full browser reload.");
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/settings") && response.request().method() === "PATCH" && response.ok()),
    page.getByRole("button", { name: "Toggle light and dark mode" }).click(),
  ]);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Your name", { exact: true }).fill("Foundation updated profile");
  const [profileRequest] = await Promise.all([
    page.waitForRequest((request) => request.url().endsWith("/api/settings") && request.method() === "PATCH"),
    page.getByRole("button", { name: "Save preferences" }).click(),
  ]);
  assert.deepEqual(profileRequest.postDataJSON(), { name: "Foundation updated profile" });
  await expect(page.getByRole("status")).toContainText("Preferences saved");
  assert.equal((await (await context.request.get(`${base}/api/settings`)).json()).theme, "light");
  console.log("Settings: saving a profile edit preserves a theme changed from the toolbar.");

  await page.goto(`${base}/vocabulary/history`);
  await expect(page.locator("details.history-row").first()).toBeVisible();
  const history = await (await context.request.get(`${base}/api/vocabulary/history`)).json();
  const first = history.sessions.find((session) => session.items.length === 20 && session.items.every((item) => item.studiedAt));
  assert.ok(first, "The isolated restart fixture should contain a completed 20-word session.");
  const sessionRow = page.locator("details.history-row").filter({ hasText: "20 of 20 words studied" }).first();
  await sessionRow.locator("summary").click();
  await expect(sessionRow.locator(".history-words > span")).toHaveCount(first.items.length);
  for (const item of first.items) await expect(sessionRow.locator(".history-words")).toContainText(item.word.word);
  await expect(page.getByRole("link", { name: /Test these \d+ words/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Quiz attempts/ }).click();
  assert.ok(history.quizzes.length > 0);
  await expect(page.getByRole("link", { name: "Review answers" }).first()).toBeVisible();
  console.log(`History: ${first.items.length} exact session words and saved quiz results rendered.`);
  const historyPattern = "**/api/vocabulary/history?page=1";
  await page.route(historyPattern, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    ...history,
    totalSessions: 1,
    sessions: [{ ...first, startedAt: "2026-09-05T17:50:00Z", completedAt: "2026-09-05T18:02:00Z", items: first.items.map((item, index) => ({ ...item, studiedAt: index === 0 ? "2026-09-05T17:59:00Z" : "2026-09-05T18:01:00Z" })) }],
  }) }));
  await page.reload();
  const disclosure = page.locator("details.history-row").first();
  await disclosure.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(page.getByRole("link", { name: "Browse Sep 5, 2026" })).toHaveAttribute("href", /date=2026-09-05/);
  await expect(page.getByRole("link", { name: "Browse Sep 6, 2026" })).toHaveAttribute("href", /date=2026-09-06/);
  await page.unroute(historyPattern);
  console.log("History: keyboard disclosure and overnight date links verified with a browser-only fixture.");

  await page.goto(`${base}/mistakes`);
  const resolveButtons = page.getByRole("button", { name: "Mark resolved", exact: true });
  await expect(resolveButtons.first()).toBeVisible();
  const before = await resolveButtons.count();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/mistakes/") && response.request().method() === "PATCH" && response.ok()),
    resolveButtons.first().click(),
  ]);
  await expect(resolveButtons).toHaveCount(before - 1);
  await expect(page.getByRole("status")).toContainText("Mistake marked resolved");
  await expect(page.getByRole("status")).toBeFocused();
  await page.getByLabel("Status").selectOption("resolved");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("button", { name: "Reopen", exact: true }).first()).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/mistakes/") && response.request().method() === "PATCH" && response.ok()),
    page.getByRole("button", { name: "Reopen", exact: true }).first().click(),
  ]);
  await expect(page.getByRole("button", { name: "Reopen", exact: true })).toHaveCount(0);
  console.log("Mistakes: resolve and reopen persisted and updated filtered views.");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["settings", "vocabulary/history", "mistakes", "today", "progress"]) {
    await page.goto(`${base}/${route}`);
    await expect(page.locator("main h1")).toBeVisible();
    if (route === "vocabulary/history") await expect(page.locator("details.history-row").first()).toBeVisible();
    if (route === "progress") {
      await page.getByText("View daily totals", { exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("main table tbody tr")).toHaveCount(7);
    }
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflows, false, `${route} overflows at 390px`);
    await page.screenshot({ path: `${output}/${route.replaceAll("/", "-")}-mobile.png`, fullPage: true, caret: "initial" });
  }
  assert.deepEqual(errors, []);
  console.log("Mobile: settings/history/mistakes/today/progress fit 390px; no browser errors.");
} finally {
  for (const url of changedMistakes) await context.request.patch(url, { data: { resolved: false } });
  const restored = await context.request.patch(`${base}/api/settings`, { data: restore });
  assert.equal(restored.ok(), true, "Failed to restore isolated test settings.");
  await browser.close();
}

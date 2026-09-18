import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const base = process.env.PRACTICE_TEST_URL ?? "http://127.0.0.1:3101";
if (!base.includes(":3101")) throw new Error("Use the isolated test server on port 3101; this smoke test saves practice attempts.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
mkdirSync(".runtime/screenshots", { recursive: true });
async function cancelNavigation(action) {
  await Promise.all([
    page.waitForEvent("dialog").then(async (dialog) => { assert.equal(dialog.type(), "confirm"); await dialog.dismiss(); }),
    action(),
  ]);
}
try {
  const before = await (await page.request.get(`${base}/api/practice/reading`)).json();
  const beforeIds = new Set(before.find((passage) => passage.id === "reading-cooler-streets").attempts.map((attempt) => attempt.id));
  await page.goto(`${base}/reading?id=reading-cooler-streets`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Designing cooler streets", exact: true })).toBeVisible();
  const after = await (await page.request.get(`${base}/api/practice/reading`)).json();
  const newAttempts = after.find((passage) => passage.id === "reading-cooler-streets").attempts.filter((attempt) => !beforeIds.has(attempt.id));
  assert.equal(newAttempts.length, 1, "A reading deep link should create exactly one attempt");
  const expected = ["TRUE", "FALSE", "NOT GIVEN", "B. Different sites had different growing conditions and space.", "glare", "benches", "FALSE", "B. The council wanted more evidence about long-term value."];
  for (let index = 0; index < expected.length; index++) {
    const card = page.locator(`#question-cooler-${index + 1}`);
    if (index === 4 || index === 5) await card.getByRole("textbox").fill(expected[index]);
    else await card.getByRole("radio", { name: expected[index], exact: true }).check();
  }
  await page.getByRole("link", { name: "Question 1, answered", exact: true }).click();
  await expect(page).toHaveURL(/#question-cooler-1$/);
  await page.getByLabel("Reading notes").fill("Compare the exact claim with the evidence.");
  await page.getByRole("button", { name: "Submit and review" }).click();
  await expect(page.getByRole("status")).toContainText("8 / 8 correct · 100%");
  await expect(page.locator("#question-cooler-2 blockquote")).toContainText("not the temperature of the air");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: ".runtime/screenshots/reading-review.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Passage library" }).click();
  await page.getByRole("button", { name: /Review .*100%/ }).first().click();
  await expect(page.getByRole("heading", { name: "Answer review" })).toBeVisible();
  console.log("PASS reading: one start, 8/8 server grading, evidence, saved notes, historical review");

  await page.goto(base + "/writing?id=writing-transport-table");
  await page.getByRole("textbox", { name: "Your plan", exact: true }).fill("Overview: Cars remained the main mode, but cycling doubled.");
  const draftText = "The table compares commuting journeys in Westbridge. Overall, cars remained the leading mode, while cycling doubled and walking stayed unchanged.";
  await page.getByRole("textbox", { name: "Draft", exact: true }).fill(draftText);
  await page.getByRole("checkbox", { name: "I wrote a clear overview of the main patterns." }).check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft, plan and self-check saved");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Draft", exact: true })).toHaveValue(draftText);
  await expect(page.getByRole("textbox", { name: "Your plan", exact: true })).toHaveValue(/cycling doubled/);
  await expect(page.getByRole("checkbox", { name: "I wrote a clear overview of the main patterns." })).toBeChecked();
  console.log("PASS writing: saved draft, legacy plan and self-check survive reload");

  await page.goto(`${base}/speaking?id=speaking-hometown-1`, { waitUntil: "networkidle" });
  await page.getByLabel("Ideas and preparation notes").fill("The riverside park and familiar neighbours.");
  await page.getByLabel("What would you improve next time?").fill("Give a specific example instead of repeating 'nice'.");
  await cancelNavigation(() => page.getByRole("button", { name: "Question library" }).click());
  await cancelNavigation(() => page.getByRole("link", { name: "Grammar", exact: true }).click());
  await expect(page.getByRole("textbox", { name: "Ideas and preparation notes" })).toHaveValue(/familiar neighbours/);
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await expect(page.locator(".timer")).not.toHaveText("00:00", { timeout: 6000 });
  await page.getByRole("button", { name: "Save attempt", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Attempt saved");
  await expect(page.getByRole("textbox", { name: "Ideas and preparation notes" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save attempt", exact: true })).toBeDisabled();
  await page.locator("details.history-row").first().locator("summary").click();
  await expect(page.locator("details.history-row").first()).toContainText("familiar neighbours");
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("details.history-row").first().locator("summary").click();
  await expect(page.locator("details.history-row").first()).toContainText("specific example");
  console.log("PASS speaking: sidebar/library cancellation, timed practice, locked saved attempt, reload and reopen");

  await page.goto(`${base}/grammar?id=grammar-agreement`, { waitUntil: "networkidle" });
  const grammarAnswers = ["is", "are", "addresses", "is", "are", "has"];
  const cards = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "Put it into practice", exact: true }) }).locator(".question-card");
  await cards.first().getByRole("radio", { name: "is", exact: true }).check();
  await cancelNavigation(() => page.getByRole("button", { name: "Check and save answers" }).click());
  await expect(cards.first().getByRole("radio", { name: "is", exact: true })).toBeChecked();
  assert.ok(await page.locator(".lesson-rules p").count() > 2, "Grammar rules should be separated into readable paragraphs");
  for (let index = 0; index < grammarAnswers.length; index++) await cards.nth(index).getByRole("radio", { name: grammarAnswers[index], exact: true }).check();
  await page.getByRole("button", { name: "Check and save answers" }).click();
  await expect(page.getByRole("status")).toContainText("6 / 6 correct · 100%");
  await expect(page.getByRole("heading", { name: "Practice history" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: ".runtime/screenshots/grammar-mobile.png", fullPage: true, animations: "disabled" });
  console.log("PASS grammar: all six answers, saved result/history, mobile no overflow");
  let failReads = true;
  await page.route("**/api/practice/speaking", async (route) => {
    if (failReads && route.request().method() === "GET") { await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Temporary connection problem." }) }); }
    else await route.continue();
  });
  await page.goto(`${base}/speaking`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "We couldn’t open your practice", exact: true })).toBeVisible();
  failReads = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("button", { name: "Part 1 · Everyday questions", exact: true })).toBeVisible();
  await page.unroute("**/api/practice/speaking");
  await page.getByRole("button", { name: "Part 2 · Long turn", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Everyday technology", exact: true })).toHaveCount(0);
  console.log("PASS speaking: load-error retry and no empty topic cards in Part 2");
  assert.deepEqual(errors, []);
  console.log("PASS no browser runtime errors");
} finally {
  await browser.close();
}

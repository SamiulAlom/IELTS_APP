import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, closeSync, openSync } from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";

// A fresh isolated database keeps verification activity out of the learner's history.
mkdirSync(".runtime", { recursive: true });
const filename = `restart-${Date.now()}.db`;
closeSync(openSync(path.resolve(".runtime", filename), "a"));
const env = { ...process.env, DATABASE_URL: `file:${path.resolve(".runtime", filename).replaceAll("\\", "/")}`, PERSISTENCE_TEST: "1" };
function run(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], { env, stdio: "inherit" });
  assert.equal(result.status, 0, `${file} failed`);
}
run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);

let server;
const base = "http://127.0.0.1:3101";
async function api(route, data, method = "POST") {
  const response = await fetch(`${base}${route}`, { method: data ? method : "GET", headers: data ? { "content-type": "application/json" } : {}, body: data ? JSON.stringify(data) : undefined });
  const result = await response.json();
  assert.equal(response.ok, true, JSON.stringify(result));
  return result;
}
async function start() {
  server = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3101"], { env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => process.stdout.write(chunk));
  server.stderr.on("data", chunk => process.stderr.write(chunk));
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch { /* Wait for this owned server to be ready. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Persistence test server did not start.");
}
function stop() {
  if (!server || server.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill("SIGTERM");
}
try {
  await start();
  const bank = await api("/api/vocabulary?source=all&limit=18");
  assert.equal(bank.total, 500);
  assert.equal(bank.pages, 28);
  assert.equal((await api("/api/vocabulary?source=all&limit=18&page=28")).words.length, 14);
  const { session } = await api("/api/vocabulary/sessions", { size: 20, source: "new" });
  assert.equal(session.items.length, 20);
  for (const item of session.items) await api(`/api/vocabulary/sessions/${session.id}`, { wordId: item.wordId, rating: "LEARNING" }, "PATCH");
  // Content updates must preserve saved study records and existing word identities.
  run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  assert.equal((await api("/api/vocabulary?source=all&limit=18")).total, 500);
  stop();
  await new Promise(resolve => setTimeout(resolve, 1500));
  await start();
  const history = await api("/api/vocabulary/history");
  const saved = history.sessions.find(item => item.id === session.id);
  assert.equal(saved.items.filter(item => item.studiedAt).length, 20);
  const today = await api("/api/vocabulary?source=today");
  const learned = await api("/api/vocabulary?source=learned");
  assert.equal(today.total, 20);
  assert.equal(learned.total, 20);
  const { attempt } = await api("/api/vocabulary/quiz", { source: "today", count: 2, mode: "DEFINITION" });
  const correctWord = session.items.find(item => item.wordId === attempt.questions[0].wordId).word.word;
  await api(`/api/vocabulary/quiz/${attempt.id}`, { questionId: attempt.questions[0].id, userAnswer: correctWord, responseTimeMs: 1000 });
  const outcome = await api(`/api/vocabulary/quiz/${attempt.id}`, { questionId: attempt.questions[1].id, userAnswer: "nottherightanswer", responseTimeMs: 1000 });
  assert.equal(outcome.attempt.correctCount, 1);
  assert.equal(outcome.attempt.wrongCount, 1);
  const weak = await api("/api/vocabulary?source=weak");
  assert.ok(weak.words.some(word => word.id === attempt.questions[1].wordId));
  const due = await api("/api/vocabulary?source=due");
  assert.equal(typeof due.total, "number");
  console.log(JSON.stringify({ passed: true, sessionWordsAfterServerRestart: 20, today: today.total, learned: learned.total, correct: 1, wrong: 1, weak: weak.total, dueQuery: "passed", database: filename }));
  if (process.argv.includes("--browser")) {
    for (const script of ["browser-word-bank", "browser-vocabulary", "browser-foundation", "browser-practice", "browser-writing", "browser-reading-studio", "browser-reading-matching", "browser-reading-real", "browser-shell"]) {
      const code = await new Promise((resolve, reject) => {
        const test = spawn(process.execPath, [`scripts/${script}.mjs`], { env, stdio: "inherit" });
        test.on("error", reject);
        test.on("exit", resolve);
      });
      assert.equal(code, 0, `${script} failed`);
    }
  }
  const fullBankQuiz = (await api("/api/vocabulary/quiz", { source: "all", count: 500, mode: "FILL_BLANK" })).attempt;
  assert.equal(fullBankQuiz.questionCount, 500);
  assert.equal(new Set(fullBankQuiz.questions.map(question => question.wordId)).size, 500);
  assert.ok(fullBankQuiz.questions.filter(question => question.questionType === "FILL_BLANK" && question.prompt.includes("______")).length >= 380);
  const reopenedQuiz = (await api(`/api/vocabulary/quiz/${fullBankQuiz.id}`)).attempt;
  assert.equal(reopenedQuiz.questions.length, 500);
  console.log(JSON.stringify({ allAvailableQuiz: "passed", uniqueQuestions: 500, reopened: true }));
} finally { stop(); }

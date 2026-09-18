import { existsSync, readFileSync, mkdirSync, openSync, closeSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";
import path from "node:path";

const local = existsSync(".env") ? parseEnv(readFileSync(".env", "utf8")) : {};
const env = { ...local, ...process.env };
const url = env.DATABASE_URL;
if (url?.startsWith("file:")) {
  const location = url.slice(5).split("?")[0];
  if (location !== ":memory:") {
    const target = path.isAbsolute(location) ? location : path.resolve("prisma", location);
    mkdirSync(path.dirname(target), { recursive: true });
    // Prisma 6's Windows engine needs the new SQLite file to exist before migrate deploy.
    // Opening in append mode preserves all data in an existing database.
    closeSync(openSync(target, "a"));
  }
}
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", ...process.argv.slice(2)], { env, stdio: "inherit" });
process.exit(result.status ?? 1);

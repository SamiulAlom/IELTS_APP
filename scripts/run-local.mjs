import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const url = 'http://127.0.0.1:3000';
const noBrowser = process.argv.includes('--no-browser');

async function ready() {
  try {
    const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) });
    const health = await response.json();
    return response.ok && health.status === 'ok' && health.database === 'connected' && typeof health.vocabularyWords === 'number';
  } catch { return false; }
}

function openBrowser() {
  console.log(`\nOpen your app: ${url}\n`);
  if (noBrowser) return;
  const command = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const browser = spawn(command, [url], { detached: true, stdio: 'ignore' });
  browser.on('error', () => console.log('Please open the address above in your browser.'));
  browser.unref();
}

async function main() {
  if (await ready()) {
    console.log('IELTS 7.5 Lab is already running.');
    openBrowser();
    return;
  }
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error('Install Node.js 22.12 or newer, then try again.');
  if (!existsSync('node_modules/next/dist/bin/next') || !existsSync('.env')) {
    throw new Error('First-time setup is needed. Follow the Setup section in README.md, then double-click Run IELTS.cmd again.');
  }
  const mode = existsSync('.next/BUILD_ID') ? 'start' : 'dev';
  console.log('Starting IELTS 7.5 Lab. Your browser will open when it is ready.');
  console.log('Keep this window open while studying. Press Ctrl+C here to stop the app.');
  const env = { ...process.env };
  delete env.PERSISTENCE_TEST;
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', mode, '--hostname', '127.0.0.1', '--port', '3000'], { env, stdio: 'inherit' });
  let exited = false;
  server.on('error', error => { exited = true; console.error(error.message); process.exitCode = 1; });
  server.on('exit', code => { exited = true; process.exitCode = code ?? 0; });
  process.on('SIGINT', () => { exited = true; server.kill('SIGINT'); });
  process.on('SIGTERM', () => { exited = true; server.kill('SIGTERM'); });
  const deadline = Date.now() + 120000;
  while (!exited && Date.now() < deadline) {
    if (await ready()) { if (!exited) openBrowser(); return; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!exited) console.log(`Startup is taking longer than usual. Check the messages above, then open ${url} when ready.`);
  else if (process.exitCode) console.error('The app could not start. Check the error above. If port 3000 is occupied, close that other app and try again.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });

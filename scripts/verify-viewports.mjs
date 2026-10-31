import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9227;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-vw-'));

const browser = spawn(chromePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${tempDir}`,
  'about:blank'
]);

await new Promise(r => setTimeout(r, 2000));

const widths = [360, 390, 768, 1280, 1440];
const url = 'https://performanceos-bq2ken4bz-yash-gaurav.vercel.app';

try {
  for (const w of widths) {
    const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const target = await newTargetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      let id = 1;
      const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

      ws.onopen = () => {
        send('Emulation.setDeviceMetricsOverride', {
          width: w,
          height: 800,
          deviceScaleFactor: 2,
          mobile: w < 1000,
        });
        send('Page.enable');
      };

      ws.onmessage = async (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Page.loadEventFired') {
          await new Promise(r => setTimeout(r, 1500));
          send('Runtime.evaluate', {
            expression: `({
              width: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
            })`,
            returnByValue: true
          });
        }
        if (msg.result?.result?.value) {
          console.log(`Width ${w}px result:`, msg.result.result.value);
          ws.close();
          resolve();
        }
      };
      ws.onerror = reject;
    });

    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  }
} finally {
  browser.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
}

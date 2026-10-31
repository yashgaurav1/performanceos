import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9226;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-perf-'));

const browser = spawn(chromePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${tempDir}`,
  'about:blank'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const url = 'https://performanceos-bq2ken4bz-yash-gaurav.vercel.app';
  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    let id = 1;
    const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

    ws.onopen = () => {
      send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 800,
        deviceScaleFactor: 2,
        mobile: true,
      });
      send('Page.enable');
    };

    ws.onmessage = async (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Page.loadEventFired') {
        await new Promise(r => setTimeout(r, 2000));
        send('Runtime.evaluate', {
          expression: `({
            totalHeight: document.documentElement.scrollHeight,
            sections: Array.from(document.querySelectorAll('section, footer')).map((el, i) => ({
              index: i,
              id: el.id || el.tagName,
              height: el.offsetHeight
            }))
          })`,
          returnByValue: true
        });
      }
      if (msg.result?.result?.value) {
        console.log('Total Mobile Height:', msg.result.result.value.totalHeight, 'px');
        console.table(msg.result.result.value.sections);
        ws.close();
        resolve();
      }
    };
    ws.onerror = reject;
  });

  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
} finally {
  browser.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
}

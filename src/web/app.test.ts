import fse from 'fs-extra';
import os from 'os';
import path, { sep } from 'path';
import http from 'http';
import fetch from 'node-fetch';
import setUpTest from '../test/setUpTest';
import getApp from './app';
import getConfig from '../config';
import { debug } from '../logger/logger';

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

test('standard payload', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);

    const CONFETTI_FILE = `
hooks:
   build:
     - touch test
    `;

    const CONFETTI_CONF_FILE = `
repositories:
    ${path.join(tmpDir, 'server')}:
        directory: ${path.join(tmpDir, 'deployment')}
`;
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);

    const url = path.join(tmpDir, 'server');
    const app = getApp();
    app.set('port', getConfig().port || 4385);
    const server = http.createServer(app);

    server.listen(getConfig().port || 4385);
    server.addListener('listening', () => {});
    const resp = await fetch('http://localhost:4385/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-github-event': 'push',
        },
        body: JSON.stringify({ repository: { url } }),
    });
    debug(await resp.text());
    server.close();
    expect(resp.status).toBe(200);
    await sleep(1500); // give time for deploy to complete
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'test'))).toBe(true);
    await fse.removeSync(tmpDir);
});

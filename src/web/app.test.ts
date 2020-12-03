import fse from 'fs-extra';
import os from 'os';
import path, { sep } from 'path';
import http from 'http';
import fetch from 'node-fetch';
import yaml from 'js-yaml';
import setUpTest from '../test/setUpTest';
import getApp from './app';
import { debug } from '../logger/logger';
import { Config } from '../interfaces/Config';

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
    const config = yaml.safeLoad(CONFETTI_CONF_FILE) as Config;
    const url = path.join(tmpDir, 'server');
    const app = getApp(config);
    const port = config.port || 4385;
    app.set('port', port);
    const server = http.createServer(app);

    server.listen(port);
    server.addListener('listening', () => {});
    try {
        const mockEvent = fse.readJsonSync(
            path.join(__dirname, '..', 'test', 'MockGHPushEvent.json')
        );
        mockEvent.repository.url = url;
        const resp = await fetch('http://localhost:4385/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-github-event': 'push',
            },
            body: JSON.stringify(mockEvent),
        });
        debug(await resp.text());
        expect(resp.status).toBe(200);
        await sleep(1500); // give time for deploy to complete
        expect(fse.existsSync(path.join(tmpDir, 'deployment', 'test'))).toBe(
            true
        );
    } catch (e) {
        server.close();
        await fse.removeSync(tmpDir);
        throw e;
    }
});

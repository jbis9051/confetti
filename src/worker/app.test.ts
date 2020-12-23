import fse from 'fs-extra';
import os from 'os';
import path, { sep } from 'path';
import http from 'http';
import fetch from 'node-fetch';
import crypto from 'crypto';
import setUpTest from '../test/setUpTest';
import getApp from './app';
import { debug } from '../logger/logger';
import { ConfettiConfiguration } from '../interfaces/ConfettiConfiguration';
import { DEFAULT_BRANCH, DEFAULT_PORT } from '../util/constants';
import { ConfettiFile } from '../interfaces/ConfettiFile';

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

test('standard payload', async (done) => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);
    const CONFETTI_FILE: ConfettiFile = {
        hooks: { default: { build: ['touch test'] } },
    };
    const CONFETTI_CONF_FILE: ConfettiConfiguration = {
        port: 4386, // conflicts when running tests
        repositories: [
            {
                [path.join(tmpDir, 'server')]: {
                    directory: path.join(tmpDir, 'deployment'),
                },
            },
        ],
    };
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    const app = getApp(CONFETTI_CONF_FILE);
    const port = CONFETTI_CONF_FILE.port || DEFAULT_PORT;
    app.set('port', port);
    const server = http.createServer(app);
    server.listen(port);
    server.addListener('listening', async () => {
        try {
            const mockEvent = fse.readJsonSync(
                path.join(__dirname, '..', 'test', 'MockGHPushEvent.json')
            );
            mockEvent.repository.html_url = url;
            mockEvent.ref = `refs/heads/${DEFAULT_BRANCH}`;
            const resp = await fetch(
                `http://localhost:${CONFETTI_CONF_FILE.port}/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-github-event': 'push',
                    },
                    body: JSON.stringify(mockEvent),
                }
            );
            debug(await resp.text());
            expect(resp.status).toBe(202);
            await sleep(1500); // give time for deploy to complete
            expect(
                fse.existsSync(path.join(tmpDir, 'deployment', 'test'))
            ).toBe(true);
            done();
        } catch (e) {
            done(e);
        } finally {
            server.close();
            await fse.removeSync(tmpDir);
        }
    });
});

test('signed payload', async (done) => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);
    const SECRET = crypto.randomBytes(64).toString('hex');
    const CONFETTI_FILE: ConfettiFile = {
        hooks: { default: { build: ['touch test'] } },
    };
    const CONFETTI_CONF_FILE: ConfettiConfiguration = {
        port: 4387,
        repositories: [
            {
                [path.join(tmpDir, 'server')]: {
                    directory: path.join(tmpDir, 'deployment'),
                    secret: SECRET,
                },
            },
        ],
    };
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    const app = getApp(CONFETTI_CONF_FILE);
    const port = CONFETTI_CONF_FILE.port || DEFAULT_PORT;
    app.set('port', port);
    const server = http.createServer(app);

    server.listen(port);
    server.addListener('listening', async () => {
        try {
            const mockEvent = fse.readJsonSync(
                path.join(__dirname, '..', 'test', 'MockGHPushEvent.json')
            );
            mockEvent.repository.html_url = url;
            mockEvent.ref = `refs/heads/${DEFAULT_BRANCH}`;
            const hmac = crypto.createHmac('sha256', SECRET);
            const signature = `sha256=${hmac
                .update(JSON.stringify(mockEvent))
                .digest('hex')}`;
            const resp = await fetch(
                `http://localhost:${CONFETTI_CONF_FILE.port}/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-github-event': 'push',
                        'x-hub-signature-256': signature,
                    },
                    body: JSON.stringify(mockEvent),
                }
            );
            debug(await resp.text());
            expect(resp.status).toBe(202);
            await sleep(1500); // give time for deploy to complete
            expect(
                fse.existsSync(path.join(tmpDir, 'deployment', 'test'))
            ).toBe(true);
            done();
        } catch (e) {
            done(e);
        } finally {
            server.close();
            await fse.removeSync(tmpDir);
        }
    });
});

test('bad signature payload', async (done) => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);
    const SECRET = crypto.randomBytes(64).toString('hex');
    const CONFETTI_FILE: ConfettiFile = {
        hooks: { default: { build: ['touch test'] } },
    };
    const CONFETTI_CONF_FILE: ConfettiConfiguration = {
        port: 4388,
        repositories: [
            {
                [path.join(tmpDir, 'server')]: {
                    directory: path.join(tmpDir, 'deployment'),
                    secret: SECRET,
                },
            },
        ],
    };
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    const app = getApp(CONFETTI_CONF_FILE);
    const port = CONFETTI_CONF_FILE.port || DEFAULT_PORT;
    app.set('port', port);
    const server = http.createServer(app);

    server.listen(port);
    server.addListener('listening', async () => {
        try {
            const mockEvent = fse.readJsonSync(
                path.join(__dirname, '..', 'test', 'MockGHPushEvent.json')
            );
            mockEvent.repository.html_url = url;
            mockEvent.ref = `refs/heads/${DEFAULT_BRANCH}`;
            const hmac = crypto.createHmac('sha256', `${SECRET}bad`);
            const signature = `sha256=${hmac
                .update(JSON.stringify(mockEvent))
                .digest('hex')}`;
            const resp = await fetch(
                `http://localhost:${CONFETTI_CONF_FILE.port}/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-github-event': 'push',
                        'x-hub-signature-256': signature,
                    },
                    body: JSON.stringify(mockEvent),
                }
            );
            debug(await resp.text());
            expect(resp.status).toBe(404);
            done();
        } catch (e) {
            done(e);
        } finally {
            server.close();
            await fse.removeSync(tmpDir);
        }
    });
});

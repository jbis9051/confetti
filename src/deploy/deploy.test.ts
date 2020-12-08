import fse from 'fs-extra';
import path, { sep } from 'path';
import os from 'os';
import { HooksArray } from '../interfaces/Hooks';
import deploy from './deploy';
import setUpTest from '../test/setUpTest';
import { ConfettiConfiguration } from '../interfaces/ConfettiConfiguration';
import { ConfettiFile } from '../interfaces/ConfettiFile';

test('standard deployment', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);
    const CONFETTI_FILE: ConfettiFile = {
        hooks: {
            default: Object.fromEntries(
                HooksArray.map((hook) => [hook, [`touch ${hook}`]])
            ),
        },
    };
    const CONFETTI_CONF_FILE: ConfettiConfiguration = {
        repositories: [
            {
                [path.join(tmpDir, 'server')]: {
                    directory: path.join(tmpDir, 'deployment'),
                    safeFiles: HooksArray.slice(),
                },
            },
        ],
    };
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    await deploy(
        url,
        CONFETTI_CONF_FILE.repositories[0][url],
        CONFETTI_CONF_FILE
    );
    expect(
        [
            ...HooksArray.filter((hook) => hook !== 'error'),
            '.confetti.yml',
            'test',
        ].every((name) => fse.existsSync(path.join(tmpDir, 'deployment', name)))
    ).toBe(true);
    await fse.removeSync(tmpDir);
});

test('environment setting in confetti file ', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);
    const CONFETTI_FILE: ConfettiFile = {
        hooks: {
            production: {
                build: ['touch testp'],
            },
            development: {
                build: ['touch testd'],
            },
        },
    };
    const CONFETTI_CONF_FILE: ConfettiConfiguration = {
        repositories: [
            {
                [path.join(tmpDir, 'server')]: {
                    directory: path.join(tmpDir, 'deployment'),
                    runnerEnvironment: 'development',
                },
            },
        ],
    };
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    await deploy(
        url,
        CONFETTI_CONF_FILE.repositories[0][url],
        CONFETTI_CONF_FILE
    );
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testd'))).toBe(true);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testp'))).toBe(
        false
    );
    await fse.removeSync(tmpDir);
});

test('environment setting in repository options', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);
    const CONFETTI_FILE: ConfettiFile = {};
    const CONFETTI_CONF_FILE: ConfettiConfiguration = {
        repositories: [
            {
                [path.join(tmpDir, 'server')]: {
                    directory: path.join(tmpDir, 'deployment'),
                    runnerEnvironment: 'production',
                    hooks: {
                        production: {
                            build: ['touch testp'],
                        },
                        development: {
                            build: ['touch testd'],
                        },
                    },
                },
            },
        ],
    };
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    await deploy(
        url,
        CONFETTI_CONF_FILE.repositories[0][url],
        CONFETTI_CONF_FILE
    );
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testp'))).toBe(true);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testd'))).toBe(
        false
    );
    await fse.removeSync(tmpDir);
});

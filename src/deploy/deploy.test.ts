import fse from 'fs-extra';
import path, { sep } from 'path';
import os from 'os';
import { HooksArray } from '../interfaces/Hooks';
import getConfig from '../config';
import deploy from './deploy';
import setUpTest from '../test/setUpTest';

test('standard deployment', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);

    const CONFETTI_FILE = `
hooks:
${HooksArray.map(
    (hook) => `  ${hook}:
    - touch ${hook}`
).join('\n')} 
`;

    const CONFETTI_CONF_FILE = `
repositories:
    ${path.join(tmpDir, 'server')}:
        directory: ${path.join(tmpDir, 'deployment')}
        safeFiles:
${HooksArray.map((hook) => `            - ${hook}`).join('\n')}
`;
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);

    const url = path.join(tmpDir, 'server');
    await deploy(url, getConfig().repositories[url]);
    expect(
        [
            ...HooksArray.filter((hook) => hook !== 'error'),
            '.confetti.yml',
            'test',
        ].every((name) => fse.existsSync(path.join(tmpDir, 'deployment', name)))
    ).toBe(true);
    await fse.removeSync(tmpDir);
});

test('environment confetti file deployment', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);

    const CONFETTI_FILE = `
hooks:
    production:
      build:
       - touch testp
    development:
      build:
        - touch testp
`;

    const CONFETTI_CONF_FILE = `
repositories:
    ${path.join(tmpDir, 'server')}:
        runnerEnvironment: production
        directory: ${path.join(tmpDir, 'deployment')}
`;
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);
    const url = path.join(tmpDir, 'server');
    await deploy(url, getConfig().repositories[url]);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testp'))).toBe(true);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testd'))).toBe(
        false
    );
    await fse.removeSync(tmpDir);
});

test('environment repository options file deployment', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);

    const CONFETTI_FILE = ``;

    const CONFETTI_CONF_FILE = `
repositories:
    ${path.join(tmpDir, 'server')}:
        runnerEnvironment: production
        directory: ${path.join(tmpDir, 'deployment')}
        hooks:
            production:
              build:
               - touch testp
            development:
              build:
                - touch testp
`;
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);

    const url = path.join(tmpDir, 'server');
    await deploy(url, getConfig().repositories[url]);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testp'))).toBe(true);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testd'))).toBe(
        false
    );
    await fse.removeSync(tmpDir);
});

test('environment config file deployment', async () => {
    const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);

    const CONFETTI_FILE = ``;

    const CONFETTI_CONF_FILE = `
repositories:
    ${path.join(tmpDir, 'server')}:
        runnerEnvironment: production
        directory: ${path.join(tmpDir, 'deployment')}
hooks:
    production:
      build:
       - touch testp
    development:
      build:
        - touch testp
`;
    await setUpTest(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);

    const url = path.join(tmpDir, 'server');
    await deploy(url, getConfig().repositories[url]);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testp'))).toBe(true);
    expect(fse.existsSync(path.join(tmpDir, 'deployment', 'testd'))).toBe(
        false
    );
    await fse.removeSync(tmpDir);
});

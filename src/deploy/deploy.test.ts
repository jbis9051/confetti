import fse from 'fs-extra';
import path, { sep } from 'path';
import os from 'os';
import yaml from 'js-yaml';
import ExecRunner from './ExecRunner';
import { HooksArray } from '../interfaces/Hooks';
import { unmute } from '../logger/logger';
import getConfig, { setConfig } from '../config';
import { Config } from '../interfaces/Config';
import deploy from './deploy';

const tmpDir = fse.mkdtempSync(`${os.tmpdir()}${sep}`);

const CONFETTI_FILE = `
hooks:
${HooksArray.map(
    (hook) => `  ${hook}:
    - touch ${hook}`
).join('\n')} 
`;

const CONFETTI_CONF_FILE = yaml.safeLoad(`
repositories:
    ${path.join(tmpDir, 'server')}:
        directory: ${path.join(tmpDir, 'deployment')}
        safeFiles:
${HooksArray.map((hook) => `            - ${hook}`).join('\n')}
`) as Config;

beforeAll(async () => {
    setConfig(CONFETTI_CONF_FILE);
    unmute();
    await ExecRunner.setOpts({ cwd: tmpDir })
        .run(`mkdir server`)
        .run(`mkdir client`)
        .run(`mkdir deployment`)
        .run(`git init --bare server`)
        .run(`touch client/test`)
        .run(() =>
            fse.writeFileSync(
                path.join(tmpDir, 'client', '.confetti.yml'),
                Buffer.from(CONFETTI_FILE)
            )
        )
        .setOpts({ cwd: path.join(tmpDir, 'client') })
        .run('git init')
        .run('git add .')
        .run('git commit --author="Jest <jest@jest.jest>" -m "initial"')
        .run(`git push --quiet ../server master`)
        .execute();
});

afterAll(() => {
    fse.removeSync(tmpDir);
});

test('deploy', async () => {
    const url = path.join(tmpDir, 'server');
    await deploy(url, getConfig().repositories[url]);
    expect(
        [
            ...HooksArray.filter((hook) => hook !== 'error'),
            '.confetti.yml',
            'test',
        ].every((name) => fse.existsSync(path.join(tmpDir, 'deployment', name)))
    ).toBe(true);
});

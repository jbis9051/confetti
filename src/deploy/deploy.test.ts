import fse from 'fs-extra';
import path, { sep } from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { HooksArray } from '../interfaces/Hooks';
import getConfig from '../config';
import { Config } from '../interfaces/Config';
import deploy from './deploy';
import setUpTests from '../test/setUpTests';

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

setUpTests(tmpDir, CONFETTI_CONF_FILE, CONFETTI_FILE);

test('standard deployment', async () => {
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

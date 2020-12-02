import fse from 'fs-extra';
import os from 'os';
import path, { sep } from 'path';
import walk from 'walk';
import yaml from 'js-yaml';
import { RepositoryEntryOptions } from '../interfaces/Config';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';
import { debug } from '../logger/logger';
import { HooksUnion } from '../interfaces/Hooks';
import { CONFETTI_FILENAME } from '../constants';
import runHook from './runHook';

export default async function deploy(
    url: string,
    options: RepositoryEntryOptions
) {
    const tmpDir = fse.mkdtempSync(
        `${os.tmpdir()}${sep}confetti-${Date.now()}`
    );
    fse.ensureDirSync(tmpDir);
    try {
        await ExecRunner.singleRun(
            `git clone --quiet --single-branch --branch ${
                options.branch || 'master'
            } '${url}' '${tmpDir}'`
        );
        const confettiFilePath = path.join(tmpDir, CONFETTI_FILENAME);
        const confettiFile: ConfettiFile | false =
            (await fse.pathExists(confettiFilePath)) &&
            (yaml.safeLoad(
                await fse.readFile(confettiFilePath).toString()
            ) as ConfettiFile);

        await runHook('prepare', options, confettiFile);

        /* await new Promise((resolve, reject) => {
            // TODO redo this crap
            const walker = walk.walk(options.directory);
            walker.on('file', (root, stats, next) => {
                const removePath = path.join(root, stats.name);
                if (options.safeFiles?.includes(removePath)) {
                    next();
                    return;
                }
                fse.remove(removePath).then(next);
            });
            walker.on('directory', (root, stats, next) => {
                const removePath = path.join(root, stats.name);
                if (options.safeFiles?.includes(removePath)) {
                    next();
                    return;
                }
                fse.remove(removePath).then(next);
            });
            // @ts-ign ore
            walker.on('error', reject);
            // @ts-ignore
            walker.on('end', resolve);
        }); */
        if (options.directory) {
            fse.ensureDirSync(options.directory);
            await ExecRunner.singleRun(`mv ${tmpDir}/* '${options.directory}'`);
        }
        await runHook('build', options, confettiFile);
        await runHook('deploy', options, confettiFile);
        await runHook('cleanup', options, confettiFile);
    } finally {
        fse.removeSync(tmpDir);
    }
}

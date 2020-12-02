import fse from 'fs-extra';
import os from 'os';
import path, { sep } from 'path';
import walk from 'walk';
import yaml from 'js-yaml';
import { RepositoryEntryOptions } from '../interfaces/Config';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';

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
        const confettiFilePath = path.join(tmpDir, 'confetti.yml');
        let confettiFile: ConfettiFile | undefined;
        if (fse.existsSync(confettiFilePath)) {
            confettiFile = yaml.safeLoad(
                fse.readFileSync(confettiFilePath).toString()
            ) as ConfettiFile;
        }

        const runHook = async (type: 'pre' | 'build') => {
            if (!confettiFile) {
                return;
            }
            let commands;
            if (options.runnerEnvironment) {
                commands =
                    confettiFile[options.runnerEnvironment] &&
                    confettiFile[options.runnerEnvironment][type];
            } else {
                commands = confettiFile[type];
            }
            if (!commands) {
                return;
            }
            const execOptions = {
                cwd: options.directory,
                env: options.env,
            };
            const execRunner = new ExecRunner();
            commands.forEach((command) => execRunner.run(command, execOptions));
            await execRunner.execute();
        };

        await runHook('pre');

        await new Promise((resolve, reject) => {
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
            // @ts-ignore
            walker.on('error', reject);
            // @ts-ignore
            walker.on('end', resolve);
        });
        fse.ensureDirSync(options.directory);
        await ExecRunner.singleRun(`mv ${tmpDir}/* '${options.directory}'`);
        await runHook('build');
    } finally {
        fse.removeSync(tmpDir);
    }
}

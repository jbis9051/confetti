import fse from 'fs-extra';
import path, { sep } from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { RepositoryEntryOptions } from '../interfaces/Config';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';
import { CONFETTI_FILENAME } from '../constants';
import runHook from './runHook';
import getTmpDir from './getTmpDir';

export default async function deploy(
    url: string,
    options: RepositoryEntryOptions
) {
    const tmpDir = await getTmpDir();
    const tmpMvDir = await getTmpDir();
    await fse.ensureDir(tmpDir);
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
                (await fse.readFile(confettiFilePath)).toString()
            ) as ConfettiFile);

        await runHook('prepare', options, confettiFile);
        const whitelist: [string, string][] = [];
        if (options.directory) {
            if (options.safeFiles) {
                await Promise.all(
                    // this moves all the safeFiles to a tmp dir and stores the new location in whitelist
                    options.safeFiles.map((filePath) => {
                        const absolutePath = filePath.startsWith(sep)
                            ? filePath
                            : path.join(options.directory!, filePath);
                        return fse.pathExists(absolutePath).then((exists) => {
                            if (exists) {
                                const newPath = path.join(
                                    tmpMvDir,
                                    crypto.randomBytes(5).toString('hex') // we do this because there could be naming conflicts
                                );
                                return fse
                                    .move(absolutePath, newPath)
                                    .then(() =>
                                        whitelist.push([absolutePath, newPath])
                                    );
                            }
                            return undefined;
                        });
                    })
                );
            }
            await fse.remove(options.directory); // now that we took care of safe files we can just remove the dir
            fse.ensureDirSync(options.directory); // but lets recreate it
            await ExecRunner.singleRun(
                `mv ${tmpDir}/{.[!.],}* '${options.directory}'`
            );
            if (whitelist.length > 0) {
                await Promise.all(
                    whitelist.map(([oldPath, currentPath]) =>
                        fse.move(currentPath, oldPath, { overwrite: true })
                    )
                );
            }
        }
        await runHook('build', options, confettiFile);
        await runHook('deploy', options, confettiFile);
        await runHook('cleanup', options, confettiFile);
    } finally {
        await Promise.all([fse.remove(tmpDir), fse.remove(tmpMvDir)]);
    }
}

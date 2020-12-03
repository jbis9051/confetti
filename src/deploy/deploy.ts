import fse from 'fs-extra';
import path, { sep } from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { Config, RepositoryEntryOptions } from '../interfaces/Config';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';
import { CONFETTI_FILENAME } from '../constants';
import runHook from './runHook';
import getTmpDir from './getTmpDir';
import { HooksUnion } from '../interfaces/Hooks';

export default async function deploy(
    url: string,
    repositoryOptions: RepositoryEntryOptions,
    globalConfig?: Config
) {
    const tmpDir = await getTmpDir();
    const tmpMvDir = await getTmpDir();
    await fse.ensureDir(tmpDir);
    try {
        await ExecRunner.singleRun(
            `git clone --quiet --single-branch --branch ${
                repositoryOptions.branch || 'master'
            } '${url}' '${tmpDir}'`
        );
        const confettiFilePath = path.join(tmpDir, CONFETTI_FILENAME);
        const confettiFile: ConfettiFile | false =
            (await fse.pathExists(confettiFilePath)) &&
            (yaml.safeLoad(
                (await fse.readFile(confettiFilePath)).toString()
            ) as ConfettiFile);

        const runHookClosure = (hook: HooksUnion) =>
            runHook(hook, repositoryOptions, globalConfig, confettiFile);

        await runHookClosure('prepare');
        const whitelist: [string, string][] = [];
        if (repositoryOptions.directory) {
            if (repositoryOptions.safeFiles) {
                await Promise.all(
                    // this moves all the safeFiles to a tmp dir and stores the new location in whitelist
                    repositoryOptions.safeFiles.map((filePath) => {
                        const absolutePath = filePath.startsWith(sep)
                            ? filePath
                            : path.join(repositoryOptions.directory!, filePath);
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
            await fse.remove(repositoryOptions.directory); // now that we took care of safe files we can just remove the dir
            await fse.ensureDir(repositoryOptions.directory); // but lets recreate it
            await fse.readdir(tmpDir).then((files) => {
                return Promise.all(
                    files.map((file) =>
                        fse.move(
                            path.join(tmpDir, file),
                            path.join(repositoryOptions.directory!, file)
                        )
                    )
                );
            });
        }
        if (whitelist.length > 0) {
            await Promise.all(
                whitelist.map(([oldPath, currentPath]) =>
                    fse.move(currentPath, oldPath, { overwrite: true })
                )
            );
        }
        await runHookClosure('build');
        await runHookClosure('deploy');
        await runHookClosure('cleanup');
    } finally {
        await Promise.all([fse.remove(tmpDir), fse.remove(tmpMvDir)]);
    }
}

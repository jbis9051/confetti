import fse from 'fs-extra';
import path, { sep } from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { URL } from 'url';
import {
    ConfettiConfiguration,
    RepositoryOptions,
} from '../interfaces/ConfettiConfiguration';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';
import { CONFETTI_FILENAME, DEFAULT_BRANCH } from '../constants';
import runHook from './runHook';
import getTmpDir from './getTmpDir';
import { HooksUnion } from '../interfaces/Hooks';

export default async function deploy(
    url: string,
    repositoryOptions: RepositoryOptions,
    globalConfig?: ConfettiConfiguration
) {
    const tmpDir = await getTmpDir();
    const tmpMvDir = await getTmpDir();
    await fse.ensureDir(tmpDir);
    let finalURL = url;
    if (/^https?:\/\//.test(url)) {
        const urlObj = new URL(url);
        if (repositoryOptions.username) {
            urlObj.username = repositoryOptions.username;
        }
        if (repositoryOptions.password) {
            urlObj.password = repositoryOptions.password;
        }
        finalURL = urlObj.href;
    }
    try {
        await ExecRunner.singleRun(
            `git clone --quiet --single-branch --branch ${
                repositoryOptions.branch || DEFAULT_BRANCH
            } '${finalURL}' '${tmpDir}'`
        );
        const confettiFilePath = path.join(tmpDir, CONFETTI_FILENAME);
        const confettiFile = (await fse.pathExists(confettiFilePath))
            ? (yaml.safeLoad(
                  (await fse.readFile(confettiFilePath)).toString()
              ) as ConfettiFile)
            : undefined;

        const runHookClosure = (hook: HooksUnion, cwd: string) =>
            runHook(hook, repositoryOptions, cwd, globalConfig, confettiFile);

        await runHookClosure('prepare', tmpDir);
        await runHookClosure('build', tmpDir);
        const whitelist: [string, string][] = [];
        if (repositoryOptions.directory) {
            if (repositoryOptions.safeFiles) {
                await Promise.all(
                    // this moves all the safeFiles to a tmp dir and stores the new location in whitelist
                    repositoryOptions.safeFiles.map((filePath) => {
                        const absolutePath = filePath.startsWith(sep)
                            ? filePath
                            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                              path.join(repositoryOptions.directory!, filePath);
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
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
        await runHookClosure('deploy', repositoryOptions.directory || tmpDir);
        await runHookClosure('cleanup', repositoryOptions.directory || tmpDir);
    } finally {
        await Promise.all([fse.remove(tmpDir), fse.remove(tmpMvDir)]);
    }
}

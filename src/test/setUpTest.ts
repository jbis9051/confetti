import fse from 'fs-extra';
import path from 'path';
import ExecRunner from '../deploy/ExecRunner';
import { debug, unmute } from '../logger/logger';

export default async function setUpTest(
    tmpDir: string,
    configurationFile: string,
    confettiFile: string
) {
    unmute();
    debug('Config:', configurationFile);
    debug('Confetti:', confettiFile);
    await ExecRunner.setOpts({ cwd: tmpDir })
        .run(`mkdir server`)
        .run(`mkdir client`)
        .run(`mkdir deployment`)
        .run(`git init --bare server`)
        .run(`touch client/test`)
        .run(() =>
            fse.writeFileSync(
                path.join(tmpDir, 'client', '.confetti.yml'),
                Buffer.from(confettiFile)
            )
        )
        .setOpts({ cwd: path.join(tmpDir, 'client') })
        .run('git init')
        .run('git config user.email "jest@jest.jest"')
        .run('git config user.name "Jest Jest"')
        .run('git add .')
        .run('git commit -m "initial"')
        .run(`git push --quiet ../server master`)
        .execute();
}

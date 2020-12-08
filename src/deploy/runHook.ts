import { HooksUnion } from '../interfaces/Hooks';
import { debug } from '../logger/logger';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';
import {
    ConfettiConfiguration,
    RepositoryOptions,
} from '../interfaces/ConfettiConfiguration';

export default async function runHook(
    hook: HooksUnion,
    repositoryOptions: RepositoryOptions,
    cwd: string,
    config?: ConfettiConfiguration,
    confettiFile?: ConfettiFile
) {
    debug(`Running hook: ${hook}`);

    function getCommands() {
        const environment =
            repositoryOptions.runnerEnvironment ||
            config?.runnerEnvironment ||
            'default'; // we don't allow an runnerEnvironment in the confetti file because that wouldn't make sense. repo options take precedent over global
        // order of precedence repositoryOptions --> confettiFile --> config
        if (repositoryOptions.hooks?.[environment]) {
            return repositoryOptions.hooks[environment][hook]; // even if the hook doesn't exist we still return. This means we don't combine environment hooks from multiple places. This is intentional.
        }
        if (confettiFile?.hooks?.[environment]) {
            return confettiFile.hooks[environment][hook];
        }
        if (config?.hooks?.[environment]) {
            return config.hooks[environment][hook];
        }
        return undefined;
    }

    const commands = getCommands();
    if (!commands) {
        debug('No hook found!');
        return;
    }
    const execOptions = {
        cwd,
        env: {
            PATH: process.env.PATH,
            ...config?.env,
            ...repositoryOptions.env,
        }, // shallow combine thought this would make sense
    };
    const execRunner = new ExecRunner();
    commands.forEach((command) => execRunner.run(command, execOptions));
    await execRunner.execute();
}

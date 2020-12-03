import { HooksUnion } from '../interfaces/Hooks';
import { debug } from '../logger/logger';
import ExecRunner from './ExecRunner';
import { ConfettiFile } from '../interfaces/ConfettiFile';
import { RepositoryEntryOptions } from '../interfaces/Config';
import getConfig from '../config';

export default async function runHook(
    hook: HooksUnion,
    repositoryOptions: RepositoryEntryOptions,
    confettiFile?: ConfettiFile | false
) {
    debug(`Running hook: ${hook}`);

    function getCommands() {
        const environment =
            repositoryOptions.runnerEnvironment ||
            getConfig().runnerEnvironment; // we don't allow an runnerEnvironment in the confetti file because that wouldn't make sense. repo options take precedent over global
        // order of precedence repositoryOptions --> confettiFile --> config
        if (environment) {
            if (
                repositoryOptions.hooks &&
                repositoryOptions.hooks[environment]
            ) {
                return repositoryOptions.hooks[environment][hook]; // even if the hook doesn't exist we still return. This means we don't combine environment hooks from multiple places. This is intentional.
            }
            if (
                confettiFile &&
                confettiFile.hooks &&
                confettiFile.hooks[environment]
            ) {
                return confettiFile.hooks[environment][hook];
            }
            if (getConfig().hooks && getConfig().hooks![environment]) {
                return getConfig().hooks![environment][hook];
            }
        }
        return (
            (repositoryOptions.hooks && repositoryOptions.hooks[hook]) ||
            (confettiFile && confettiFile.hooks && confettiFile.hooks[hook]) ||
            (getConfig() && getConfig().hooks && getConfig().hooks![hook])
        );
    }

    const commands = getCommands();
    if (!commands) {
        debug('No hook found!');
        return;
    }
    const execOptions = {
        cwd: repositoryOptions.directory,
        env: { ...getConfig().env, ...repositoryOptions.env }, // shallow combine thought this would make sense
    };
    const execRunner = new ExecRunner();
    commands.forEach((command) => execRunner.run(command, execOptions));
    await execRunner.execute();
}

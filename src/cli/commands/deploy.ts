import chalk from 'chalk';
import { error, info, success } from '../../logger/logger';
import deployFunction from '../../deploy/deploy';
import askQuestion from '../util/askQuestion';
import { ConfettiConfiguration } from '../../interfaces/ConfettiConfiguration';

export default async function deploy(
    repositories: string[] | 'all',
    config: ConfettiConfiguration
) {
    const repositoriesObjs = config.repositories.filter((repo) => {
        if (repositories === 'all') {
            return true;
        }
        return repositories.includes(Object.keys(repo)[0]);
    });
    const deploymentListing = repositoriesObjs
        .map((repoObj) => {
            const url = Object.keys(repoObj)[0];
            return `${url} --> ${repoObj[url].directory}`;
        })
        .join('\n');
    info(`Planning to deploy the following:
        ${deploymentListing}\n`);
    const answer = await askQuestion(
        chalk.yellow(
            'Are you sure you want to deploy all these repositories? y/n: '
        )
    );
    if (answer !== 'y' && answer !== 'yes') {
        return;
    }
    let succeeded = 0;
    await Promise.all(
        config.repositories.map((repoObj) => {
            const url = Object.keys(repoObj)[0];
            info(`Deploying '${url}'`);
            return deployFunction(url, repoObj[url], config)
                .then(() => {
                    succeeded += 1;
                    success(`🎉 Deploying '${url}' succeeded! 🎉`);
                })
                .catch((err) => {
                    error(
                        `Deploying '${url}' failed with error: ${err.toString()}`
                    );
                });
        })
    );
    if (succeeded === repositoriesObjs.length) {
        success(`🎉 All deployments were successful. Whoopie! 🎉`);
    } else {
        error(`Uh Oh. ${succeeded}/${repositoriesObjs.length} succeeded`);
    }
}

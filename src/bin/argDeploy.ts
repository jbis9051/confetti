import chalk from 'chalk';
import { error, info, success } from '../logger/logger';
import deploy from '../deploy/deploy';
import getGlobalConfig from '../getGlobalConfig';
import askQuestion from './askQuestion';

const config = getGlobalConfig();

export default async function argDeploy() {
    const deploymentListing = config.repositories
        .map((repoObj) => {
            const url = Object.keys(repoObj)[0];
            return `${url} --> ${repoObj[url].directory}`;
        })
        .join('\n');
    info(`Planning to deploy the following:
        ${deploymentListing}
`);
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
        Object.entries(config.repositories).map(([key, value]) => {
            info(`Deploying '${key}'`);
            return deploy(key, value, config)
                .then(() => {
                    succeeded += 1;
                    success(`🎉 Deploying '${key}' succeeded! 🎉`);
                })
                .catch((err) => {
                    error(
                        `Deploying '${key}' failed with error: ${err.toString()}`
                    );
                });
        })
    );
    if (succeeded === Object.keys(config.repositories).length) {
        success(`🎉 All deployments were successful. Whoopie! 🎉`);
    } else {
        error(
            `Uh Oh. ${succeeded}/${
                Object.keys(config.repositories).length
            } succeeded`
        );
    }
}

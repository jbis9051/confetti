#!/usr/bin/env node

import chalk from 'chalk';
import * as readline from 'readline';
import deploy from '../deploy/deploy';
import { error, info, success, unmute } from '../logger/logger';
import getConfig from '../config';

unmute();

const args = process.argv.splice(2);

function askQuestion(query: string) {
    // https://stackoverflow.com/a/50890409/7886229
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

async function argDeploy() {
    const deploymentListing = Object.entries(getConfig().repositories)
        .map(([key, value]) => {
            return `${key} --> ${value.directory}`;
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
        Object.entries(getConfig().repositories).map(([key, value]) => {
            info(`Deploying '${key}'`);
            return deploy(key, value)
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
    if (succeeded === Object.keys(getConfig().repositories).length) {
        success(`🎉 All deployments were successful. Whoopie! 🎉`);
    } else {
        error(
            `Uh Oh. ${succeeded}/${
                Object.keys(getConfig().repositories).length
            } succeeded`
        );
    }
}

switch (args[0]) {
    case 'deploy':
        argDeploy();
        break;
    default:
        throw new Error('Argument Required');
}

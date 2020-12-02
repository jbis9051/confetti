#!/usr/bin/env node

import chalk from 'chalk';
import * as readline from 'readline';
import config from '../config';
import deploy from '../deploy/deploy';

const args = process.argv.splice(2);

function log(...arg: any[]) {
    // eslint-disable-next-line no-console
    console.log(...arg);
}

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
    log(
        chalk.yellowBright(`Planning to deploy the following:
        ${Object.entries(config.repositories)
            .map(([key, value]) => {
                return `${key} --> ${value.directory}`;
            })
            .join('\n')}
        `)
    );
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
            log(chalk.yellowBright(`Deploying '${key}'`));
            return deploy(key, value)
                .then(() => {
                    succeeded += 1;
                    log(chalk.green(`🎉 Deploying '${key}' succeeded! 🎉`));
                })
                .catch((err) => {
                    log(
                        chalk.redBright(`Deploying '${key}' failed with error: 
                ${err.toString()}
                `)
                    );
                });
        })
    );
    if (succeeded === Object.keys(config.repositories).length) {
        log(chalk.green(`🎉 All deployments were successful. Whoopie! 🎉`));
    } else {
        log(
            chalk.redBright(
                `Uh Oh. ${succeeded}/${
                    Object.keys(config.repositories).length
                } succeeded`
            )
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

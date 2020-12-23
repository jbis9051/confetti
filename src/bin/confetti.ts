#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import deploy from '../cli/commands/deploy';
import loadConfigurationFile from '../util/loadConfigurationFile';
import getGlobalConfig from '../util/getGlobalConfig';
import workerControl from '../cli/commands/workerControl';
import { CONFETTI_CONFIG_PATH } from '../util/constants';

program
    .command('init', 'Initialize a confetti config file')
    .option('-c, --config <path>', 'Specify a config file path')
    .action((cmd) => {
        const options = cmd.opts();
        const configPath = options.config || CONFETTI_CONFIG_PATH;
        fs.writeFileSync(
            configPath,
            `repositories:
    `
        );
    });

program
    .command('deploy')
    .description('Manually deploy. Helpful for testing.')
    .option(
        '-r, --repos <repositories...>',
        "Specific repositories to deploy. 'all' to deploy all. Default 'all'",
        'all'
    )
    .option('-c, --config <path>', 'Specify a config file path')
    .action((cmd) => {
        const options = cmd.opts();
        deploy(
            options.repos,
            options.config
                ? loadConfigurationFile(options.config)
                : getGlobalConfig()
        );
    });

program
    .command('start')
    .description('Starts worker process')
    .option('-c, --config <path>', 'Specify a config file path')
    .action((cmd) => workerControl('start', cmd.opts()));

program
    .command('stop')
    .description('Stops worker process')
    .action((cmd) => workerControl('stop', cmd.opts()));

program
    .command('restart')
    .description('Restarts worker process')
    .option('-c, --config <path>', 'Specify a config file path')
    .action((cmd) => workerControl('restart', cmd.opts()));

program.parse(process.argv);

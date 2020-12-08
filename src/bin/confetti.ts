#!/usr/bin/env node

import argDeploy from './argDeploy';

const args = process.argv.splice(2);

switch (args[0]) {
    case 'deploy':
        argDeploy();
        break;
    default:
        throw new Error('Argument Required');
}

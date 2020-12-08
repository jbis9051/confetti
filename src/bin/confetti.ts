#!/usr/bin/env node

import argDeploy from './argDeploy';
import { unmute } from '../logger/logger';

unmute();

const args = process.argv.splice(2);

switch (args[0]) {
    case 'deploy':
        argDeploy();
        break;
    default:
        throw new Error('Argument Required');
}

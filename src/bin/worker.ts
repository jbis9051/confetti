#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import createApp from '../worker/app';
import getGlobalConfig from '../util/getGlobalConfig';
import { CONFETTI_PID_PATH, DEFAULT_PORT } from '../util/constants';
import { debug } from '../logger/logger';
import loadConfigurationFile from '../util/loadConfigurationFile';

const config = process.env.CONFETTI_CONFIG_PATH
    ? loadConfigurationFile(process.env.CONFETTI_CONFIG_PATH)
    : getGlobalConfig();

if (fs.existsSync(CONFETTI_PID_PATH)) {
    throw new Error('Worker already running');
}

fs.writeFileSync(CONFETTI_PID_PATH, process.pid.toString(10));

function onExit() {
    if (fs.existsSync(CONFETTI_PID_PATH)) {
        fs.unlinkSync(CONFETTI_PID_PATH);
    }
    debug('exiting');
    process.exit();
}

process.on('exit', onExit);
process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);

const port = config.port || DEFAULT_PORT;
const app = createApp(config);
app.set('port', port);
const server = http.createServer(app);

server.listen(port);
server.addListener('listening', () => debug('server started'));

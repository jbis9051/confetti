#!/usr/bin/env node

import http from 'http';
import createApp from '../web/app';
import getGlobalConfig from '../getGlobalConfig';
import { DEFAULT_PORT } from '../constants';
import { debug } from '../logger/logger';

const config = getGlobalConfig();

const port = config.port || DEFAULT_PORT;
const app = createApp(config);
app.set('port', port);
const server = http.createServer(app);

server.listen(port);
server.addListener('listening', () => debug('server started'));

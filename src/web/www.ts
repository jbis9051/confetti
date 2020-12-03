#!/usr/bin/env node

import http from 'http';
import createApp from './app';
import getGlobalConfig from '../getGlobalConfig';

const config = getGlobalConfig();

const port = config.port || 4385;
const app = createApp(config);
app.set('port', port);
const server = http.createServer(app);

server.listen(port);
server.addListener('listening', () => {});

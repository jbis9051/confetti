#!/usr/bin/env node

import http from 'http';
import getApp from './app';
import getConfig from '../config';

const app = getApp();
app.set('port', getConfig().port || 4385);
const server = http.createServer(app);

server.listen(getConfig().port);
server.addListener('listening', () => {});

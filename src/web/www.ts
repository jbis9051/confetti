#!/usr/bin/env node

import http from 'http';
import app from './app';
import config from '../config';

app.set('port', config.port);
const server = http.createServer(app);

server.listen(config.port);
server.addListener('listening', () => {});

#!/usr/bin/env node

import http from 'http';
import app from './app';
import getConfig from '../config';

app.set('port', getConfig().port);
const server = http.createServer(app);

server.listen(getConfig().port);
server.addListener('listening', () => {});

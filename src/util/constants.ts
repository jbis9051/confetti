import path from 'path';
import * as os from 'os';

export const CONFETTI_FILENAME = '.confetti.yml';
export const CONFETTI_CONFIG_PATH =
    os.arch() === 'darwin'
        ? '/usr/local/etc/confetti-conf.yml'
        : '/etc/confetti-conf.yml';
export const CONFETTI_PID_PATH =
    os.arch() === 'darwin'
        ? '/usr/local/var/run/confetti.pid'
        : '/var/run/confetti.pid';
export const LOG_PATH = path.join(process.cwd(), 'confetti.log');
export const DEFAULT_PORT = 4385;
export const DEFAULT_BRANCH = 'master';

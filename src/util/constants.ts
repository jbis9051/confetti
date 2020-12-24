import * as os from 'os';

export const CONFETTI_FILENAME = '.confetti.yml';
export const CONFETTI_CONFIG_PATH =
    os.platform() === 'darwin'
        ? '/usr/local/etc/confetti-conf.yml'
        : '/etc/confetti-conf.yml';
export const CONFETTI_PID_PATH =
    os.platform() === 'darwin'
        ? '/usr/local/var/run/confetti.pid'
        : '/var/run/confetti.pid';
export const LOG_PATH =
    os.platform() === 'darwin'
        ? '/usr/local/var/log/confetti.log'
        : '/var/log/confetti.log';
export const DEFAULT_PORT = 4385;
export const DEFAULT_BRANCH = 'master';

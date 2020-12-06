import path from 'path';

export const CONFETTI_FILENAME = '.confetti.yml';
export const CONFETTI_CONFIG_PATH = '/etc/confetti-conf.yml';
export const LOG_PATH = path.join(process.cwd(), 'confetti.log');
export const DEFAULT_PORT = 4385;
export const DEFAULT_BRANCH = 'master';

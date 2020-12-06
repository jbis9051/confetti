import * as fs from 'fs';
import { LOG_PATH } from '../constants';

// based on https://github.com/phenomnomnominal/betterer

let muted = true;

function log(...args: any[]) {
    if (!muted) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
    const now = new Date();
    const string = args
        .map((arg) => arg.toString())
        .join(' ')
        .split('\n')
        .map((line: string) => `${now.toUTCString()} ${line}`)
        .join('\n');
    fs.appendFileSync(LOG_PATH, `${string}\n`);
}

function createLogger(name: string) {
    return (...messages: string[]) => {
        const spacedMessages = messages.map((message) =>
            message
                .toString()
                .split('\n')
                .map((text, i) => {
                    if (i === 0) {
                        return text;
                    }
                    return ' '.repeat(name.length + 5) + text; // " [] " is 4 + 1 from space from date
                })
                .join('\n')
        );
        log(` [${name}] `, ...spacedMessages);
    };
}

export const mute = () => {
    muted = true;
};
export const unmute = () => {
    muted = false;
};
export const debug = createLogger('debg');
export const success = createLogger('succ');
export const info = createLogger('info');
export const warn = createLogger('warn');
export const error = createLogger('erro');

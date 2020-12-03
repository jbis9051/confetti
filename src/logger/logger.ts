import chalk from 'chalk';

// based on https://github.com/phenomnomnominal/betterer

const SPACER = chalk.yellowBright(' - ');

let muted = true;

function log(...args: any[]) {
    if (muted) {
        return;
    }
    // eslint-disable-next-line no-console
    console.log(...args);
}

function createLogger(name: string) {
    return (...messages: string[]) => {
        log(
            `${name}${SPACER}`,
            ...messages.map((m) =>
                chalk.green(
                    m
                        .split('\n')
                        .map((text, i) => {
                            if (i === 0) {
                                return text;
                            }
                            return (
                                ' '.repeat(
                                    // eslint-disable-next-line no-control-regex
                                    (name + SPACER).replace(/[‌]*\[\d+m?/g, '') // remove the color stuff
                                        .length
                                ) + text
                            );
                        })
                        .join('\n')
                )
            )
        );
    };
}

export const mute = () => {
    muted = true;
};
export const unmute = () => {
    muted = false;
};
export const debug = createLogger(chalk.bgBlue.white(' debg '));
export const success = createLogger(chalk.bgGreenBright.black(' succ '));
export const info = createLogger(chalk.bgWhiteBright.black(' info '));
export const warn = createLogger(chalk.bgYellowBright.black(' warn '));
export const error = createLogger(chalk.bgRedBright.white(' erro '));

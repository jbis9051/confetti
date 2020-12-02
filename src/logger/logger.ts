import chalk from 'chalk';

// based on https://github.com/phenomnomnominal/betterer

const SPACER = chalk.bgBlack.yellowBright(' - ');

let muted = true;

function log(...args: any[]){
    if(muted){
        return;
    }
    // eslint-disable-next-line no-console
    console.log(...args);
}

function createLogger(name: string, icon: string) {
    return (...messages: string[]) => {
        log(`${name}${icon}${SPACER}`, ...messages.map((m) => chalk.whiteBright(m)));
    }
}

export const mute = () => { muted = true};
export const unmute = () => { muted = false};
export const debug = createLogger(chalk.bgBlue.white(' debg '), chalk.bgBlack(' 🤔 '));
export const success = createLogger(chalk.bgGreenBright.black(' succ '), chalk.bgBlack(' ✅ '));
export const info = createLogger(chalk.bgWhiteBright.black(' info '), chalk.bgBlack(' 💬 '));
export const warn = createLogger(chalk.bgYellowBright.black(' warn '), chalk.bgBlack(' 🚨 '));
export const error = createLogger(chalk.bgRedBright.white(' erro '), chalk.bgBlack(' 🔥 '));

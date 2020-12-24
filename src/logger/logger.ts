// based on https://github.com/phenomnomnominal/betterer

function log(...args: any[]) {
    // eslint-disable-next-line no-console
    console.log(...args);
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

export const debug = createLogger('debg');
export const success = createLogger('succ');
export const info = createLogger('info');
export const warn = createLogger('warn');
export const error = createLogger('erro');

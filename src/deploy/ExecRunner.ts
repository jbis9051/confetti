import { exec, ExecOptions } from 'child_process';
import { BaseEncodingOptions } from 'fs';
import { debug, warn, error as errorLog } from '../logger/logger';

type SingleRunOptions = (BaseEncodingOptions & ExecOptions) | undefined | null;

type RunnerArg =
    | string
    | ((
          // eslint-disable-next-line no-unused-vars
          arg?: [string, string]
      ) =>
          | void
          | [string, SingleRunOptions]
          | Promise<void | [string, SingleRunOptions]>);

export default class ExecRunner {
    private bag: [RunnerArg, SingleRunOptions][] = [];

    private opts: SingleRunOptions;

    static singleRun(
        command: string,
        options?: SingleRunOptions
    ): Promise<[string, string]> {
        return new Promise((resolve, reject) => {
            debug(`Running: ${command}`);
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    errorLog(stderr.toString().trim());
                    reject(error);
                    return;
                }
                if (stderr) {
                    warn(stderr.toString().trim());
                }
                resolve([stdout.toString(), stderr.toString()]);
            });
        });
    }

    static run(command: RunnerArg) {
        const runner = new ExecRunner();
        runner.run(command);
        return runner;
    }

    static setOpts(options: SingleRunOptions) {
        const runner = new ExecRunner();
        runner.setOpts(options);
        return runner;
    }

    run(
        command: RunnerArg,
        options?: (BaseEncodingOptions & ExecOptions) | null
    ) {
        this.bag.push([command, options]);
        return this;
    }

    setOpts(opts: SingleRunOptions) {
        this.bag.push([
            () => {
                this.opts = { ...this.opts, ...opts };
            },
            undefined,
        ]);
        return this;
    }

    async execute() {
        const buffer = this.bag.slice().reverse();
        let previousResult: [string, string] | undefined;
        while (buffer.length > 0) {
            const run = buffer.pop()!;
            if (typeof run[0] === 'function') {
                // eslint-disable-next-line no-await-in-loop
                const returnValue = await run[0](previousResult);
                if (returnValue) {
                    buffer.push(returnValue);
                }
                previousResult = undefined;
            }
            if (typeof run[0] === 'string') {
                // eslint-disable-next-line no-await-in-loop
                previousResult = await ExecRunner.singleRun(run[0], {
                    ...this.opts,
                    ...run[1],
                });
            }
        }
        return previousResult;
    }
}

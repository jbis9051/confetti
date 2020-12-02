import { exec, ExecOptions } from 'child_process';
import { BaseEncodingOptions } from 'fs';
import { debug } from '../logger/logger';

type SingleRunOptions = (BaseEncodingOptions & ExecOptions) | undefined | null;

type RunnerArg =
    | string
    | ((
          // eslint-disable-next-line no-unused-vars
          stdout?: string | Buffer
      ) =>
          | void
          | [string, SingleRunOptions]
          | Promise<void | [string, SingleRunOptions]>);

export default class ExecRunner {
    private bag: [RunnerArg, SingleRunOptions][] = [];

    static singleRun(
        command: string,
        options?: SingleRunOptions
    ): Promise<string | Buffer | undefined> {
        return new Promise((resolve, reject) => {
            debug(`Running: ${command}`);
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    reject(stderr);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    static run(command: RunnerArg) {
        const runner = new ExecRunner();
        runner.run(command);
        return runner;
    }

    run(
        command: RunnerArg,
        options?: (BaseEncodingOptions & ExecOptions) | null
    ) {
        this.bag.push([command, options]);
        return this;
    }

    async execute() {
        const buffer = this.bag.slice();
        let previousResult: undefined | string | Buffer;
        while (buffer.length > 0) {
            const run = buffer.pop()!;
            if (typeof run[0] === 'function') {
                // eslint-disable-next-line no-await-in-loop
                const returnValue = await run[0](previousResult);
                if (returnValue) {
                    buffer.unshift(returnValue);
                }
                previousResult = undefined;
            }
            if (typeof run[0] === 'string') {
                // eslint-disable-next-line no-await-in-loop
                previousResult = await ExecRunner.singleRun(run[0], run[1]);
            }
        }
        return previousResult;
    }
}

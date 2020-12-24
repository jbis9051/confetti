import { spawn } from 'child_process';
import path from 'path';
import * as fs from 'fs';
import fse from 'fs-extra';
import {
    CONFETTI_CONFIG_PATH,
    CONFETTI_PID_PATH,
    LOG_PATH,
} from '../../util/constants';
import { error, success, warn } from '../../logger/logger';

export default async function workerControl(command: string, options?: any) {
    switch (command) {
        case 'start': {
            if (!fse.existsSync(CONFETTI_CONFIG_PATH)) {
                error(
                    `Config not found at '${CONFETTI_CONFIG_PATH}'. Run 'sudo confetti init'`
                );
                return;
            }
            if (fs.existsSync(CONFETTI_PID_PATH)) {
                error('Worker already running');
                return;
            }
            const fd = fse.openSync(LOG_PATH, 'a');
            const worker = spawn(
                process.execPath,
                [path.join(__dirname, '..', '..', 'bin', 'worker.js')],
                {
                    detached: true,
                    windowsHide: true,
                    stdio: ['ignore', fd, fd],
                    env: {
                        PATH: process.env.PATH,
                        CONFETTI_CONFIG_PATH: options?.config,
                    },
                }
            );
            fs.closeSync(fd);
            worker.unref();
            success(`Started worker with pid ${worker.pid}`);
            break;
        }
        case 'stop':
            if (!fs.existsSync(CONFETTI_PID_PATH)) {
                warn(
                    'Unable to find PID file. Worker is probably not running.'
                );
                return;
            }
            process.kill(
                parseInt(fs.readFileSync(CONFETTI_PID_PATH).toString(), 10),
                'SIGTERM'
            );
            success('Done');
            break;
        case 'restart':
            await workerControl('stop', options);
            await workerControl('start', options);
            break;
        default:
            throw new Error('Invalid command');
    }
}

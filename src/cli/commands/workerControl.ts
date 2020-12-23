import { spawn } from 'child_process';
import path from 'path';
import * as fs from 'fs';
import { CONFETTI_PID_PATH } from '../../util/constants';

export default async function workerControl(command: string, options?: any) {
    switch (command) {
        case 'start':
            spawn(path.join(__dirname, '..', 'worker'), {
                detached: true,
                windowsHide: true,
                env: {
                    PATH: process.env.PATH,
                    CONFETTI_CONFIG_PATH: options?.config,
                },
            });
            break;
        case 'stop':
            process.kill(
                parseInt(fs.readFileSync(CONFETTI_PID_PATH).toString(), 10),
                'SIGTERM'
            );
            break;
        case 'restart':
            await workerControl('stop', options);
            await workerControl('start', options);
            break;
        default:
            throw new Error('Invalid command');
    }
}

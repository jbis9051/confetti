import { HookRecord } from './Hooks';

export type ConfettiFile = {
    hooks?: {
        [key: string]: HookRecord;
    } & HookRecord;
};

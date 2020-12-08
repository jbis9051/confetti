import { HookRecord } from './Hooks';

export type HookList = {
    [key: string]: HookRecord;
} & HookRecord;

interface SharedOptions {
    hooks?: HookList;
    secret?: string;
    branch?: string;
    runnerEnvironment?: string;
    env?: {
        [key: string]: string;
    };
}

export interface RepositoryOptions extends SharedOptions {
    username?: string;
    password?: string;
    directory?: string;
    safeFiles?: string[];
}

export interface ConfettiConfiguration extends SharedOptions {
    port?: number;
    secret?: string;
    path?: string;
    repositories: {
        [url: string]: RepositoryOptions;
    }[];
}

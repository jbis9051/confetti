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

export type RepositoryOptions = {
    username?: string;
    password?: string;
    directory?: string;
    safeFiles?: string[];
} & SharedOptions;

export type Config = {
    port?: number;
    secret?: string;
    path?: string;
    repositories: {
        [url: string]: RepositoryOptions;
    }[];
} & SharedOptions;

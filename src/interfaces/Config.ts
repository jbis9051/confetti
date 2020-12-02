import { HookRecord } from './Hooks';

interface SharedOptions {
    secret?: string;
    env?: {
        [key: string]: string;
    };
    branch?: string;
    runnerEnvironment?: string;
    hooks?: {
        [key: string]: HookRecord;
    } & HookRecord;
}

export type RepositoryEntryOptions = {
    directory?: string;
    safeFiles?: string[];
} & SharedOptions;

export type Config = {
    port?: number;
    secret?: string;
    path?: string;
    repositories: {
        [url: string]: RepositoryEntryOptions;
    };
} & SharedOptions;

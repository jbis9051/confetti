import { HookRecord } from './Hooks';

export type HookList = {
    [key: string]: HookRecord;
} & HookRecord;

interface SharedOptions {
    secret?: string;
    env?: {
        [key: string]: string;
    };
    branch?: string;
    runnerEnvironment?: string;
    hooks?: HookList;
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

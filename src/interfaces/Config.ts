export interface RepositoryEntryOptions {
    directory: string;
    safeFiles?: string[];
    username: string;
    token: string;
    branch?: string;
    secret?: string;
    runnerEnvironment?: string;
    env?: {
        [key: string]: string;
    };
}

export interface Config {
    port: number;
    secret?: string;
    repositories: {
        [key: string]: RepositoryEntryOptions;
    };
}

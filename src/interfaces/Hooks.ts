export type HooksUnion = 'prepare' | 'build' | 'deploy' | 'cleanup';
export type HookRecord = Record<HooksUnion, string[]>;

export const HooksArray = [
    'prepare',
    'build',
    'deploy',
    'cleanup',
    'error',
] as const;
export type HooksUnion = typeof HooksArray[number];
export type HookRecord = Record<HooksUnion, string[]>;

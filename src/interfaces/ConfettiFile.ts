import { HookRecord } from './Hooks';

export type ConfettiFile = {
    hooks?: Record<'default' | string, HookRecord>;
};

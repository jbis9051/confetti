export type ConfettiFile = {
    [key: string]: {
        pre?: string[];
        build?: string[];
    };
} & {
    pre?: string[];
    build?: string[];
};

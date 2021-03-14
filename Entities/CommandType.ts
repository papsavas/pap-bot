export type commandType = {
    prefix: string;
    fullCommand: string;
    splitCommand: string[];
    primaryCommand: string;
    arg1: string | undefined;
    arg2: string | undefined;
    arg3: string | undefined;
    commandless1: string | undefined;
    commandless2: string | undefined;
    commandless3: string | undefined;
}

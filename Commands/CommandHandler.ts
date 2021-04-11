export interface CommandHandler{
    onCommand():Promise<any>;
}
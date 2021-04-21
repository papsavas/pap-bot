import {Message} from "discord.js";

export interface CommandHandler {
    onCommand(message: Message): Promise<any>;
}
import { Message, CommandInteraction, ApplicationCommandManager, GuildApplicationCommandManager, Client } from "discord.js";
import { GenericCommand } from "../GenericCommand";
import GenericGlobalCommand from "./GenericGlobalCommand";
import { GlobalCommandHandler } from "./GlobalCommandHandler";
import { MockMessageCmdImpl } from "./Impl/mockMessageCmdImpl";
import { userNotesCmdImpl } from "./Impl/userNotesCmdImpl";

export default class GlobalCommandHandlerImpl implements GlobalCommandHandler {
    private readonly commands: GenericGlobalCommand[];
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
        this.commands = [
            new MockMessageCmdImpl(), new userNotesCmdImpl()
        ];
    }

    onCommand(message: Message): Promise<any> {
        throw new Error("Method not implemented.");
    }
    onSlashCommand(interaction: CommandInteraction): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async fetchApplicationCommands() {
        if (false)
            return this.client.application.commands.set(this.commands.map(cmd => cmd.getCommandData()))
        else
            return this.client.application.commands.fetch();
    }
}
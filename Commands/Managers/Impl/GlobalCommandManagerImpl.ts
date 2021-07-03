import { Message, CommandInteraction, ApplicationCommandManager, GuildApplicationCommandManager, Client } from "discord.js";
import { GenericCommand } from "../../GenericCommand";
import GenericGlobalCommand from "../../Global/GenericGlobalCommand";
import { GlobalCommandManager } from "../Interf/GlobalCommandManager";
import { MockMessageCmdImpl } from "../../Global/Impl/mockMessageCmdImpl";
import { userNotesCmdImpl } from "../../Global/Impl/userNotesCmdImpl";

export default class GlobalCommandManagerImpl implements GlobalCommandManager {
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
import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { guildId } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchEvents } from "../../../tools/Google/Gcalendar";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_eventsCmd } from "../Interf/KEP_eventsCmd";

const refreshLiteral = "refresh";

export class KEP_eventsCmdImpl extends AbstractGuildCommand implements KEP_eventsCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `events`;
    protected _guide = `Διαχειρίζεται τα events στο google calendar`;
    protected _usage = `${this.keyword} ${refreshLiteral}}`;
    private constructor() { super() }

    static async init(): Promise<KEP_eventsCmd> {
        const cmd = new KEP_eventsCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ["event"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: refreshLiteral,
                    description: `Ανανεώνει τα events`,
                    type: "SUB_COMMAND"
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has("MANAGE_GUILD"))
            return interaction.reply("`MANAGE_GUILD` permissions required")
        const subCommand = interaction.options.getSubcommand(true);
        return handleRequest(subCommand);

    }
    async execute(message: Message, { arg1 }: commandLiteral): Promise<unknown> {
        if (!message.member.permissions.has("MANAGE_GUILD"))
            return message.reply("`MANAGE_GUILD` permissions required")
        return handleRequest(arg1);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

function handleRequest(subcommand: string) {
    switch (subcommand) {

        case refreshLiteral: {
            return reloadEvents();
        }

        default:
            return Promise.reject("invalid subcommand")
    }
}

async function reloadEvents() {
    const kep = guildMap.get(guildId) as KepGuild;
    kep.events = await fetchEvents();
}
import { ApplicationCommandData, Collection, CommandInteraction, GuildMember, Message, Snowflake } from "discord.js";
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

    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    protected _keyword = `calendar_events`;
    protected _guide = `Διαχειρίζεται τα events του Google Calendar`;
    protected _usage = `${this.keyword} ${refreshLiteral}}`;
    private constructor() { super() }

    static async init(): Promise<KEP_eventsCmd> {
        const cmd = new KEP_eventsCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.mergeAliases
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
        await interaction.deferReply({ ephemeral: true });
        const subCommand = interaction.options.getSubcommand(true);
        return this.handleRequest(interaction, subCommand);

    }
    async execute(message: Message, { arg1 }: commandLiteral): Promise<unknown> {
        return this.handleRequest(message, arg1);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    async handleRequest(source: Message | CommandInteraction, subcommand: string) {
        const member = source.member instanceof GuildMember ?
            source.member : await source.guild.members.fetch(source.member.user.id);
        if (!member.permissions.has("MANAGE_GUILD"))
            return this.respond(source, { content: "`MANAGE_GUILD` permissions required" });
        switch (subcommand) {
            case refreshLiteral: {
                return reloadEvents()
                    .then(() => this.respond(source, { content: "Events reloaded" }));
            }
            default:
                return Promise.reject("invalid subcommand")
        }
    }
}

async function reloadEvents() {
    const kep = guildMap.get(guildId) as KepGuild;
    kep.events = await fetchEvents();
}
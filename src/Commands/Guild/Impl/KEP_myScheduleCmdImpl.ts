import { ChatInputApplicationCommandData, CommandInteraction, InteractionReplyOptions, Message, ReplyMessageOptions, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { guildId as kepGuildId } from "../../../../values/KEP/IDs.json";
import { examsPrefix } from "../../../../values/KEP/literals.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { textSimilarity } from "../../../tools/cmptxt";
import { sliceToEmbeds } from "../../../tools/Embed";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_myScheduleCmd } from "../Interf/KEP_myScheduleCmd";

export class KEP_myScheduleCmdImpl extends AbstractGuildCommand implements KEP_myScheduleCmd {

    protected _id: Snowflake;
    protected _keyword = `myschedule`;
    protected _guide = `Σας εμφανίζει το εβδομαδιαίο σας πρόγραμμα`;
    protected _usage = `myschedule`;
    private constructor() { super() }
    static async init(): Promise<KEP_myScheduleCmd> {
        const cmd = new KEP_myScheduleCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["my_schedule", "schedule"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        return handleRequest(interaction)
    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return handleRequest(message);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

function handleRequest(request: Message | CommandInteraction): Promise<unknown> {
    const classes = (guildMap.get(kepGuildId) as KepGuild).students.get(request.member.user.id)?.classes;
    const events = (guildMap.get(kepGuildId) as KepGuild).events
        .filter(ev => !ev.summary?.includes(examsPrefix));

    const respond = (response: string): ReplyMessageOptions | InteractionReplyOptions => request.type === "APPLICATION_COMMAND" ?
        { content: response, ephemeral: true } :
        { content: response };

    if (!classes || classes.size === 0)
        return request.reply(respond("Δεν βρέθηκαν μαθήματα"));

    if (events.length === 0)
        return request.reply(respond("Δεν βρέθηκαν προγραμματισμένα μαθήματα"));

    const studentClasses = events
        .map(ev => Object.assign(ev, {
            summary: ev.summary
                .trimStart()
                .trimEnd()
        }))
        .filter(ev => classes
            .find(c => textSimilarity(
                c.name,
                ev.summary
            ) > 0.85
            )
        )

    const embeds = sliceToEmbeds({
        data: studentClasses
            .map(ev => ({
                name: ev.summary, value: ev.start.date
            })),
        headerEmbed: {
            title: `MySchedule`,
            description: `Το εβδομαδιαίο σας πρόγραμμα`
        }
    })
    return request.reply({ embeds });
}
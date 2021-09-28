import { ChatInputApplicationCommandData, Collection, CommandInteraction, InteractionReplyOptions, Message, ReplyMessageOptions, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { guildId as kepGuildId } from "../../../../values/KEP/IDs.json";
import { lecturePrefix } from "../../../../values/KEP/literals.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { textSimilarity } from "../../../tools/cmptxt";
import { sliceToEmbeds } from "../../../tools/Embed";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_myScheduleCmd } from "../Interf/KEP_myScheduleCmd";

export class KEP_myScheduleCmdImpl extends AbstractGuildCommand implements KEP_myScheduleCmd {

    protected _id: Collection<Snowflake, Snowflake>;
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
            ["my_schedule", "schedule"], this._keyword
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
    const courses = (guildMap.get(kepGuildId) as KepGuild).students.get(request.member.user.id)?.courses;
    const events = (guildMap.get(kepGuildId) as KepGuild).events
        .map(ev => ({ ...ev, summary: ev.summary.trimStart().trimEnd() }))
        .filter(ev => ev.summary?.startsWith(lecturePrefix));

    const respond = (response: string): ReplyMessageOptions | InteractionReplyOptions => request.type === "APPLICATION_COMMAND" ?
        { content: response, ephemeral: true } :
        { content: response };

    if (!courses || courses.size === 0)
        return request.reply(respond("Δεν βρέθηκαν μαθήματα"));

    if (events.length === 0)
        return request.reply(respond("Δεν υπάρχουν καταχωρημένες ημερομηνίες διαλέξεων"));

    const studentCourses = events
        .filter(ev => courses
            .find(c => textSimilarity(
                c.name,
                ev.summary
            ) > 0.85
            )
        )

    const embeds = sliceToEmbeds({
        data: studentCourses
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
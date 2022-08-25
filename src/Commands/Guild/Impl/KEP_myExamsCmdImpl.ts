import { APIEmbedField, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, CommandInteraction, InteractionReplyOptions, Message, ReplyMessageOptions, RESTJSONErrorCodes, Snowflake } from "discord.js";
import { calendar_v3 } from "googleapis";
import moment from "moment";
import 'moment/locale/el';
import urlRegex from "url-regex";
import { guildId as kepGuildId } from "../../../../values/KEP/IDs.json" assert { type: 'json' };
import { examsPrefix } from "../../../../values/KEP/literals.json" assert { type: 'json' };
import { commandLiteral } from "../../../Entities/Generic/command";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { guilds } from "../../../Inventory/guilds";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { textSimilarity } from "../../../tools/cmptxt";
import { sliceToEmbeds } from "../../../tools/Embed";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_myExamsCmd } from "../Interf/KEP_myExamsCmd";

moment.locale('el');

//TODO: cleanup

const fieldBuilder = ((ev: calendar_v3.Schema$Event): APIEmbedField => ({
    name: `• 📅 ${moment(ev.start.dateTime).format('LL')}, ${moment(ev.start.dateTime).tz("Europe/Athens").format("kk:mm")} - ${moment(ev.end.dateTime).tz("Europe/Athens").format("kk:mm")}`,
    value: `[**${ev.summary}**](${ev.description.match(urlRegex({ strict: true })).toString()})`
}));
export class KEP_myExamsCmdImpl extends AbstractGuildCommand implements KEP_myExamsCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `myexams`;
    readonly guide = `Εμφανίζει τα επερχόμενα εξεταζόμενα μαθήματά σας`;
    readonly usage = `${this.keyword}`;
    private constructor() { super() }

    static async init(): Promise<KEP_myExamsCmd> {
        const cmd = new KEP_myExamsCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['my_exams', 'exams', 'myexams'], this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        return this.handleRequest(interaction);
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return this.handleRequest(message);
    }
    handleRequest(source: ChatInputCommandInteraction | Message) {
        const user = source instanceof ChatInputCommandInteraction ?
            source.user :
            source.author;
        const courses = (guilds.get(kepGuildId) as KepGuild).students.get(user.id)?.courses;
        const events = (guilds.get(kepGuildId) as KepGuild).events
            .filter(ev => ev.summary?.startsWith(examsPrefix));


        const responseBuilder = (response: string): ReplyMessageOptions | InteractionReplyOptions =>
            source instanceof ChatInputCommandInteraction ?
                { content: response, ephemeral: true } :
                { content: response };

        if (!courses || courses.size === 0)
            return this.respond(source, { content: "Δεν έχετε επιλέξει μαθήματα" })

        if (events.length === 0)
            return this.respond(source, { content: "Δεν βρέθηκαν προγραμματισμένα μαθήματα" });

        const studentCourseEvents = events
            .map(ev => ({
                ...ev,
                summary: ev.summary.replace(examsPrefix, '')
                    .trimStart()
                    .trimEnd()
            })
            )
            .filter(ev => courses
                .find(c => textSimilarity(
                    c.name,
                    ev.summary
                ) > 0.85
                )
            )
        if (studentCourseEvents.length === 0)
            return this.respond(source, { content: 'Δεν βρέθηκαν προγραμματισμένα μαθήματα' });

        const [first, last] = [studentCourseEvents[0], studentCourseEvents[studentCourseEvents.length - 1]]
            .map(ev => moment(ev.start.dateTime).format('LL'));
        const responseEmbeds = sliceToEmbeds({
            data: studentCourseEvents.map(fieldBuilder),
            headerEmbed: {
                title: `MyExams`,
                description: `Η εξεταστική σας ξεκινάει **${first}** και ολοκληρώνεται **${last}**`
            }
        })

        user.send({ embeds: responseEmbeds })
            .then(msg => {
                msg.react("🗑");
                if (source instanceof CommandInteraction)
                    this.respond(source, { content: `Σας το έστειλα στα DMs` })
                else
                    source.react('👌')
            })
            .catch(async err => {
                if (err.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
                    if (source instanceof ChatInputCommandInteraction) {
                        const interaction = source;
                        const resp: InteractionReplyOptions = {
                            content: `Τα DMs σας ειναι κλειστά, το αποστέλλω εδώ`,
                            embeds: responseEmbeds,
                            ephemeral: true
                        }
                        return interaction.replied ?
                            interaction.followUp(resp) :
                            interaction.reply(resp)
                    }
                    else {
                        const emoji = "📨";
                        const msg = await source.reply(`Έχετε κλειστά DMs. Εαν θέλετε να το στείλω εδώ, πατήστε το ${emoji}`);
                        await msg.react(emoji);
                        await msg.react("🗑️");
                        const collected = await msg.awaitReactions({
                            filter: (reaction, user) => ['🗑️', '🗑', emoji].includes(reaction.emoji.name) && !user.bot,
                            time: 10000,
                            max: 1
                        });
                        if (collected.first().emoji.name === emoji)
                            await source.reply({ embeds: responseEmbeds });
                        await msg.delete(); //delete prompt either way
                    }
                }
                else
                    throw err;
            })
    }


}


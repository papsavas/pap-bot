import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, GuildMember, Message, MessageEmbed, Snowflake } from "discord.js";
import Profanity from "profanity-js";
import { findAll } from "../../../DB/GenericCRUD";
import { commandLiteral } from "../../../Entities/Generic/command";
import { memberResponses } from "../../../Entities/Generic/MemberResponses";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { loadSwearWords } from "../../../Queries/Generic/loadSwearWords";
import { addMemberResponse, countMemberResponses, fetchGuildMemberResponses, removeMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { paginationEmbed, sliceToEmbeds } from "../../../tools/Embed";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { myPersonalCmd } from "../Interf/myResponsesCmd";


const [add, show, remove] = ['add', 'show', 'remove'];
const response: ApplicationCommandOptionData['name'] = 'response';
export class myResponsesCmdImpl extends AbstractGuildCommand implements myPersonalCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `myresponses`;
    protected _guide = `Manage your submitted responses`;
    protected _usage = `myresponses`;

    private constructor() { super() }

    static async init(): Promise<myPersonalCmd> {
        const cmd = new myResponsesCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }


    private readonly _aliases = this.addKeywordToAliases
        (
            ['myresponses', 'my_responses', 'responses', 'myresp', 'myresps'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: add,
                    description: `Add a response`,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: response,
                            description: 'your response',
                            type: 'STRING',
                            required: true
                        }
                    ]
                },
                {
                    name: remove,
                    description: `Remove a response`,
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: response,
                            description: 'exact response',
                            type: 'STRING',
                            required: true

                        }
                    ]
                },
                {
                    name: show,
                    description: `Show all responses`,
                    type: "SUB_COMMAND"
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand(true);
        const resp = interaction.options.getString(response, true);
        return interaction.editReply({
            embeds: await embedResponse(interaction, subcommand, resp)
        })
    }

    async execute(message: Message, { arg1, commandless2 }: commandLiteral): Promise<any> {
        const guild_id = message.guildId;
        const member_id = message.author.id;
        return message.reply({
            embeds: await embedResponse(message, arg1, commandless2)
        })

    }

    getAliases(): string[] {
        return this._aliases
    }


    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}

async function embedResponse(request: CommandInteraction | Message, subcommand: string, response?: string): Promise<MessageEmbed[]> {
    const guild_id = request.guildId;
    const member_id = request.member.user.id;
    switch (subcommand?.toLowerCase()) {
        case add: {
            if (await countMemberResponses(member_id, guild_id) > 20)
                return [
                    new MessageEmbed({
                        title: "Quantity Limit",
                        description: `You can only have 20 responses per guild`,
                        color: "RED"
                    })
                ]
            const swears = await loadSwearWords();
            const nsfw = swears.some((swear) =>
                response.includes(swear['swear_word'])) ||
                new Profanity().isProfane(response);
            await addMemberResponse(guild_id, member_id, response, nsfw);
            return [
                new MessageEmbed({
                    title: `Response Added`,
                    description: ` your response has been added`,
                    fields: [
                        { name: `response`, value: `\`\`\`${response}\`\`\`` },
                        { name: `marked as nsfw`, value: nsfw.toString(), inline: true }
                    ]
                })
            ]

        }
        case remove: {
            const resp = await removeMemberResponse(guild_id, member_id, response);
            return [new MessageEmbed({
                title: `Removed Response`,
                description: resp
            })]
        }

        case show: {
            const responses: string[] = (await fetchGuildMemberResponses(guild_id, member_id)).map(r => r['response']);
            return sliceToEmbeds({
                data: responses.map((r, i) => ({ name: `${i}`, value: r })),
                headerEmbed: {
                    title: `Your Added Responses ✍ 💬`
                }
            })
        }

        default:
            return [new MessageEmbed({
                title: `Invalid Subcommand`,
                description: `Please use one of the following subcommands: \`${add}\`, \`${remove}\`, \`${show}\``,
            })]
    }
}

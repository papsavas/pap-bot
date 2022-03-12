import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Colors, CommandInteraction, Embed, Message, Snowflake } from "discord.js";
import Profanity from "profanity-js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { loadSwearWords } from "../../../Queries/Generic/loadSwearWords";
import { addMemberResponse, fetchGuildMemberResponses, memberResponsesCount, removeMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { sliceToEmbeds } from "../../../tools/Embed";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { myResponsesCmd } from "../Interf/myResponsesCmd";


const [add, show, remove] = ['add', 'show', 'remove'];
const response: ApplicationCommandOptionData['name'] = 'response';
const usage = "myresponses add <response> | remove <index> | show";
export class myResponsesCmdImpl extends AbstractGuildCommand implements myResponsesCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `myresponses`;
    readonly guide = `Manage your submitted responses`;
    readonly usage = `${this.keyword}`;

    private constructor() { super() }

    static async init(): Promise<myResponsesCmd> {
        const cmd = new myResponsesCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }


    readonly aliases = this.mergeAliases
        (
            ['myresponses', 'my_responses', 'responses', 'myresp', 'myresps'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: add,
                    description: `Add a response`,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: response,
                            description: 'your response',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: remove,
                    description: `Remove a response`,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "index",
                            description: 'the index of the shown response',
                            type: ApplicationCommandOptionType.Integer,
                            required: true

                        }
                    ]
                },
                {
                    name: show,
                    description: `Show all responses`,
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand(true);
        const resp = interaction.options.getString(response);
        const index = interaction.options.getInteger('index');
        return interaction.editReply({
            embeds: await embedResponse(interaction, subcommand, resp ?? index)
        })
    }

    async execute(message: Message, { arg1, args2 }: commandLiteral): Promise<any> {
        return message.reply({
            embeds: await embedResponse(message, arg1, args2)
        })

    }






}

async function embedResponse(request: CommandInteraction | Message, subcommand: string, input?: string | number): Promise<Embed[]> {
    const guild_id = request.guildId;
    const member_id = request.member.user.id;
    if (!subcommand)
        return [new Embed({
            title: `Wrong syntax [subcommand]`,
            description: '**usage:** ' + usage,
            color: Colors.Red
        })]
    switch (subcommand?.toLowerCase()) {
        case add: {
            const response = (input as string).trimEnd();
            if (!response)
                return [new Embed({
                    title: `Wrong syntax [response]`,
                    description: '**usage:** ' + usage,
                    color: Colors.Red
                })]
            if (await memberResponsesCount(member_id, guild_id) > 20)
                return [
                    new Embed({
                        title: "Quantity Limit",
                        description: `You can only have 20 responses per guild`,
                        color: Colors.Red
                    })
                ]
            const swears = await loadSwearWords();
            const nsfw = swears.some((swear) =>
                response.includes(swear)) ||
                new Profanity().isProfane(response);
            await addMemberResponse(guild_id, member_id, response, nsfw);
            return [
                new Embed({
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
            const index = input as number;
            if (typeof index === 'undefined')
                return [new Embed({
                    title: `Wrong syntax [index]`,
                    description: '**usage:** ' + usage,
                    color: Colors.Red
                })]
            const res = await removeMemberResponse(guild_id, member_id, index);
            return [new Embed({
                title: `Remove Response`,
                description: res
            })]
        }

        case show: {
            const responses: string[] = (await fetchGuildMemberResponses(guild_id, member_id));
            if (responses.length === 0)
                return [
                    new Embed({
                        title: `Your responses`,
                        description: `You have no responses in this guild. Add using **myresponses add <response>**`,
                    })
                ]
            return sliceToEmbeds({
                data: responses.map((r, i) => ({ name: `${i + 1}.`, value: r })),
                headerEmbed: {
                    title: `Your Added Responses ✍ 💬`,
                    footer: { text: `You can add up to 20 responses` }
                },
                size: 3
            })
        }

        default:
            return [new Embed({
                title: `Invalid Subcommand`,
                description: `Please use one of the following subcommands: \`${add}\`, \`${remove}\`, \`${show}\``,
            })]
    }
}

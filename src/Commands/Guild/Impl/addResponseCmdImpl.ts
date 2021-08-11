import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, GuildMember, Message, MessageEmbed, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from '../../../index';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { loadSwearWords } from "../../../Queries/Generic/loadSwearWords";
import { addMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { addResponseCmd } from "../Interf/addResponseCmd";
const profanity = require('profanity-js');
const Profanity = new profanity();

const responseOptionLiteral: ApplicationCommandOptionData['name'] = 'response';
export class AddResponseCmdImpl extends AbstractGuildCommand implements addResponseCmd {
    protected _id: Snowflake;
    protected _keyword = `addresponse`;
    protected _guide = `Adds a user response to bots replies`;
    protected _usage = `addresponse <response>`;

    private constructor() { super() }

    static async init(): Promise<addResponseCmd> {
        const cmd = new AddResponseCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['addresponse', 'add_response', 'ar'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: responseOptionLiteral,
                    description: 'your response',
                    type: 'STRING',
                    required: true

                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction) {
        const memberResponse = interaction.options.getString(responseOptionLiteral, true)
        const guildID = interaction.guildId;
        const memberID = interaction.member.user.id;
        const swears = await loadSwearWords();
        const nsfw = swears.some((swear) =>
            memberResponse.includes(swear['swear_word'])) ||
            Profanity.isProfane(memberResponse);
        this.addGuildLog(guildID, `${(interaction.member as GuildMember).displayName} added response ${memberResponse.substr(0, 100)}`);
        await interaction.deferReply({ ephemeral: true });
        await addMemberResponse(guildID, memberID, memberResponse, nsfw);
        return interaction.editReply({
            embeds:
                [
                    new MessageEmbed({
                        title: `Response Added`,
                        description: ` your response has been added`,
                        fields: [
                            { name: `response`, value: `\`\`\`${memberResponse}\`\`\`` },
                            { name: `marked as nsfw`, value: nsfw.toString(), inline: true }
                        ]
                    })
                ]
        })
    }

    async execute({ guild, member }: Message, { commandless1 }: commandLiteral) {
        const swears = await loadSwearWords();
        const nsfw = swears.some((swear) =>
            commandless1.includes(swear['swear_word'])) ||
            Profanity.isProfane(commandless1);
        this.addGuildLog(guild.id, `${member.displayName} added response ${commandless1.substr(0, 100)}`);
        return addMemberResponse(
            guild.id,
            member.id,
            commandless1, nsfw
        )
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
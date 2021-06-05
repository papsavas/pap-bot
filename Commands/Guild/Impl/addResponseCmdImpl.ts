import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Message, MessageEmbed, Snowflake } from "discord.js";
import { guildMap } from '../../..';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { loadSwearWords } from "../../../Queries/Generic/loadSwearWords";
import { addMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { Gaddresponse as _guide } from '../../guides.json';
import { addresponse as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { addResponseCmd } from "../Interf/addResponseCmd";
const profanity = require('profanity-js');
const Profanity = new profanity();

const responeOptionLiteral: ApplicationCommandOptionData['name'] = 'response';
export class AddResponseCmdImpl extends AbstractGuildCommand implements addResponseCmd {
    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<addResponseCmd> {
        const cmd = new AddResponseCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['addresponse', 'add_response', 'ar'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: responeOptionLiteral,
                    description: 'your response',
                    type: 'STRING',
                    required: true

                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction) {
        const memberResponse = interaction.options.get(responeOptionLiteral).value as string;
        const guildID = interaction.guildID;
        const memberID = interaction.member.user.id;
        const swears = await loadSwearWords();
        const nsfw = swears.some((swear) =>
            memberResponse.includes(swear['swear_word'])) ||
            Profanity.isProfane(memberResponse);
        await interaction.defer({ ephemeral: true });
        await addMemberResponse(guildID, memberID, memberResponse, nsfw);
        return interaction.editReply(new MessageEmbed({
            title: `Response Added`,
            description: ` your response has been added`,
            fields: [
                { name: `response`, value: `\`\`\`${memberResponse}\`\`\`` },
                { name: `marked as nsfw`, value: nsfw.toString(), inline: true }
            ]
        }))
    }

    public async execute({ guild, member }: Message, { commandless1 }: literalCommandType) {
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

    getKeyword(): string {
        return _keyword;
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
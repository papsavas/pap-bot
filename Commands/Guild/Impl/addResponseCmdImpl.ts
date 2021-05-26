import { addresponse as _keyword } from '../../keywords.json';
import { Gaddresponse as _guide } from '../../guides.json';
import { AbstractCommand } from "../AbstractCommand";
import { addResponseCmd } from "../Interf/addResponseCmd";
import { ApplicationCommandData, CommandInteraction, Interaction, Message, MessageEmbed, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { loadSwearWords } from "../../../Queries/Generic/loadSwearWords";
import { addMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
const profanity = require('profanity-js');
const Profanity = new profanity();

export class AddResponseCmdImpl extends AbstractCommand implements addResponseCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['addresponse', 'add_response', 'ar'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'response',
                    description: 'your response',
                    type: 'STRING',
                    required: true

                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction) {
        const memberResponse = interaction.options[0].value as string;
        const guildID = interaction.guildID;
        const memberID = interaction.member.user.id;
        const swears = await loadSwearWords();
        const nsfw = swears.some((swear) =>
            memberResponse.includes(swear['swear_word'])) ||
            Profanity.isProfane(memberResponse);
        await interaction.defer(true);
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
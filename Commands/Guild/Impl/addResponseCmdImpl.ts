import { addresponse as _keyword } from '../../keywords.json';
import { Gaddresponse as _guide } from '../../guides.json';
import { injectable } from "Inversify";
import { AbstractCommand } from "../AbstractCommand";
import { addResponseCmd } from "../Interf/addResponseCmd";
import { ApplicationCommandData, CommandInteraction, Interaction, Message, MessageEmbed } from "discord.js";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { loadSwearWords } from "../../../Queries/Generic/loadSwearWords";
import { addMemberResponse } from "../../../Queries/Generic/MemberResponses";
const profanity = require('profanity-js');
const Profanity = new profanity();

@injectable()
export class AddResponseCmdImpl extends AbstractCommand implements addResponseCmd {

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
        const memberID = interaction.member.id;
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
                { name: `marked as nsfw`, value: nsfw.toString() }
            ]
        }))
    }

    public async execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType) {
        const swears = await loadSwearWords();
        const nsfw = swears.some((swear) =>
            receivedMessage.content.includes(swear['swear_word'])) ||
            Profanity.isProfane(receivedMessage.cleanContent);
        return addMemberResponse(receivedMessage.guild.id, receivedMessage.member.id, receivedCommand.commandless1, nsfw)
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
}
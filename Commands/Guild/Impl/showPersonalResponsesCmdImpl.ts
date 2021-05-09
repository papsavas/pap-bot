import { AbstractCommand } from "../AbstractCommand";
import { myresponses as _keyword } from '../../keywords.json';
import { Gmyresponses as _guide } from '../../guides.json';
import { ApplicationCommandData, CommandInteraction, GuildManager, GuildMember, Message, MessageEmbed } from "discord.js";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { showPersonalResponsesCmd } from "../Interf/showPersonalResponsesCmd";
import { fetchAllGuildMemberResponses, fetchGuildMemberResponses } from "../../../Queries/Generic/MemberResponses";
import { paginationEmbed } from "../../../toolbox/paginatedEmbed";


export class ShowPersonalResponsesCmdImpl extends AbstractCommand implements showPersonalResponsesCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['myresponses', 'my_responses', 'responses', 'myresp', 'myresps'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide()
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.defer(true);
        const guild_id = interaction.guildID;
        const member_id = (interaction.member as GuildMember).id;
        const responses = await fetchGuildMemberResponses(guild_id, member_id);
        const responsesArr = responses.map(resObj => resObj['response']);
        return interaction.editReply(`\`\`\`${responsesArr.toString()}\`\`\``);
    }

    async execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const member_id = receivedMessage.member.id;
        const perPage = 10;
        const timeout = 60000;
        const responses = await fetchGuildMemberResponses(guild_id, member_id);
        const responsesArr = responses.map(resObj => resObj['response'])
        const fieldBuilder = (resp, index, start) => [start + index + 1 + ')', resp];

        const headerEmbed = new MessageEmbed(
            {
                author: {
                    name: receivedMessage.member.displayName,
                    iconURL: receivedMessage.member.user.avatarURL({ format: 'png' })
                },
                title: `Your Added Responses ✍ 💬`,
                color: `#fcfcfc`,
                footer: { text: this.getAliases().toString() }
            }
        );
        return paginationEmbed(
            receivedMessage,
            responsesArr,
            perPage,
            headerEmbed,
            fieldBuilder,
            timeout
        )
    }

    getKeyword(): string {
        return _keyword
    }

    getAliases(): string[] {
        return this._aliases
    }

    getGuide(): string {
        return _guide;
    }

}

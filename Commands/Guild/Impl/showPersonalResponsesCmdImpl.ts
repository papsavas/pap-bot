import { ApplicationCommandData, CommandInteraction, GuildMember, Message, MessageEmbed, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchGuildMemberResponses } from "../../../Queries/Generic/MemberResponses";
import { paginationEmbed } from "../../../toolbox/paginatedEmbed";
import { Gmyresponses as _guide } from '../../guides.json';
import { myresponses as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { showPersonalResponsesCmd } from "../Interf/showPersonalResponsesCmd";


export class ShowPersonalResponsesCmdImpl extends AbstractGuildCommand implements showPersonalResponsesCmd {

    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<showPersonalResponsesCmd> {
        const cmd = new ShowPersonalResponsesCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }


    private readonly _aliases = this.addKeywordToAliases
        (
            ['myresponses', 'my_responses', 'responses', 'myresp', 'myresps'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide()
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.defer({ ephemeral: true });
        const guild_id = interaction.guildID;
        const member_id = (interaction.member as GuildMember).id;
        const responses = await fetchGuildMemberResponses(guild_id, member_id);
        const responsesArr = responses.map(resObj => resObj['response']);
        return interaction.followUp(`\`\`\`${responsesArr.toString()}\`\`\``);
    }

    async execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
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

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}

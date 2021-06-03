import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, GuildMember, Message, Snowflake } from 'discord.js';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { removeMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { GremoveResponse as _guide } from '../../guides.json';
import { removeResponse as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { removePersonalResponseCmd } from "../Interf/removePersonalResponseCmd";


const respOptionLiteral: ApplicationCommandOptionData['name'] = 'response';
export class RemovePersonalResponseCmdImpl extends AbstractGuildCommand implements removePersonalResponseCmd {

    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<removePersonalResponseCmd> {
        const cmd = new RemovePersonalResponseCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['removeresponse', 'rresponse', 'remove_response', 'rr'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: respOptionLiteral,
                    description: 'exact personal response',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const { guildID, member, options } = interaction;
        return interaction.reply(
            await removeMemberResponse(
                guildID, (member as GuildMember).id,
                options.get(respOptionLiteral).value as string
            ),
            { ephemeral: true }
        );
    }

    async execute(message: Message, { commandless1 }: literalCommandType) {
        return message.reply(await removeMemberResponse(message.guild.id, message.member.id, commandless1));
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

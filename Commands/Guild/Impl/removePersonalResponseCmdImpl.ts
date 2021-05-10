import { ApplicationCommandData, CommandInteraction, GuildMember, Message, Snowflake } from 'discord.js';
import { commandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { removeMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { GremoveResponse as _guide } from '../../guides.json';
import { removeResponse as _keyword } from '../../keywords.json';
import { AbstractCommand } from "../AbstractCommand";
import { removePersonalResponseCmd } from "../Interf/removePersonalResponseCmd";



export class RemovePersonalResponseCmdImpl extends AbstractCommand implements removePersonalResponseCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['removeresponse', 'rresponse', 'remove_response', 'rr'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'response',
                    description: 'exact personal response',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute({ guildID, member, options, reply }: CommandInteraction): Promise<any> {
        return reply(await removeMemberResponse(guildID, (member as GuildMember).id, options[0].value as string), { ephemeral: true });
    }

    async execute(message: Message, { commandless1 }: commandType) {
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

import {Message, MessageEmbed} from 'discord.js';
import {showPerms as _keyword} from '../../keywords.json';
import {GshowPerms as _guide} from '../../guides.json';
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";
import {showPermsCmd} from "../Interf/showPermsCmd";
import {fetchCommandPerms} from "../../../Queries/Generic/guildRolePerms";
import {guildMap} from "../../../index";
import {fetchAllOnCondition} from "../../../DB/CoreRepo";
import {removePersonalResponseCmd} from "../Interf/removePersonalResponseCmd";
import {removeMemberResponse} from "../../../Queries/Generic/MemberResponses";

@injectable()
export class RemovePersonalResponseCmdImpl extends AbstractCommand implements removePersonalResponseCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['removeresponse', 'rresponse', 'remove_response', 'rr'],
        _keyword
    );

    async execute(message: Message, {commandless1}: commandType, addGuildLog: guildLoggerType) {
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
}
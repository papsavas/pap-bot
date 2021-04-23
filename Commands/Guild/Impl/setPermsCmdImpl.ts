import {injectable} from "inversify";
import {AbstractCommand} from "../AbstractCommand";
import {setPerms as _keyword} from '../../keywords.json';
import {GsetPerms as _guide} from '../../guides.json';
import {Message} from "discord.js";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";
import {setPermsCmd} from "../Interf/setPermsCmd";
import {overrideCommandPerms} from "../../../Queries/Generic/guildRolePerms";

@injectable()
export class SetPermsCmdImpl extends AbstractCommand implements setPermsCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['setPerms', 'setperms', 'set_perms'],
        _keyword
    );

    execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const roles = receivedMessage.mentions.roles;
        const command_id = receivedCommand.arg1; //cannot retrieve command from aliases, must be exact
        return overrideCommandPerms(guild_id, command_id, roles.keyArray());
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

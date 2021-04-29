import {ApplicationCommandData, Message, MessageEmbed} from 'discord.js';
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

@injectable()
export class ShowPermsCmdsImpl extends AbstractCommand implements showPermsCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['perms', 'perm', 'showperms', 'show_perms'],
        _keyword
    );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'command',
                    description: 'permissions for command',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async execute(message, {arg1}: commandType, addGuildLog: guildLoggerType) {
        const command_id = arg1;
        const guild_prefix = guildMap.get(message.guild.id).getSettings().prefix;
        const commandPerms = await fetchCommandPerms(message.guild.id, command_id);
        return Promise.all(commandPerms.map(cp => message.guild.roles.fetch(cp.role_id)))
            .then(reqRoles=>
                message.reply(new MessageEmbed({
                    title:guild_prefix+command_id,
                    description: `Enabled for : ${reqRoles.toString()}`,
                }))
        );
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
import {injectable} from "inversify";
import {AbstractCommand} from "../AbstractCommand";
import {pollCmd} from "../Interf/pollCmd";
import {setPrefix as _keyword} from '../../keywords.json';
import {GsetPrefix as _guide} from '../../guides.json';
import {Message} from "discord.js";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";
import {fetchGuildSettings, updateGuildSettings} from "../../../Queries/Generic/GuildSettings";
import {addRow} from "../../../DB/dbRepo";

@injectable()
export class SetPrefixCmdImpl extends AbstractCommand implements pollCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['prefix', 'setprefix', 'sp'],
        _keyword
    );

    execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType): Promise<any> {
        return fetchGuildSettings(receivedMessage.guild.id)
            .then(async oldSettings => {
                const newSettings = Object.assign(oldSettings, {'prefix': receivedCommand.arg1});
                return updateGuildSettings(receivedMessage.guild.id, newSettings)
            });

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

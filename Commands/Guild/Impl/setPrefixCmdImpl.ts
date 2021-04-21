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
import {guildMap} from "../../../index";

@injectable()
export class SetPrefixCmdImpl extends AbstractCommand implements pollCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['prefix', 'setprefix'],
        _keyword
    );

    execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType): Promise<any> {
        const guildHandler = guildMap.get(receivedMessage.guild.id);
        if(receivedCommand.arg1)
            return fetchGuildSettings(receivedMessage.guild.id)
                .then(async oldSettings => {
                    const newSettings = Object.assign(oldSettings, {'prefix': receivedCommand.arg1});
                    return updateGuildSettings(receivedMessage.guild.id, newSettings).then(()=> guildHandler.setPrefix(receivedCommand.arg1))
                });
        else
            return receivedMessage.reply(`Current prefix is "${guildHandler.getSettings().prefix}"`, {code:true});

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

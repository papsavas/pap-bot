import {Message} from 'discord.js';
import {nsfwSwitch as _keyword} from '../../keywords.json';
import {GnsfwSwitch as _guide} from '../../guides.json';
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";
import { nsfwSwitchCmd } from '../Interf/nsfwSwitchCmd';
import { fetchGuildSettings, updateGuildSettings } from '../../../Queries/Generic/GuildSettings';
import { guildMap } from '../../..';

@injectable()
export class NsfwSwitchCmdImpl extends AbstractCommand implements nsfwSwitchCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['nsfw', 'nsfwswitch'],
        _keyword
    );

    async execute(message: Message, {}: commandType, addGuildLog: guildLoggerType) {
        try { 
            const oldSettings = await fetchGuildSettings(message.guild.id);
            const literal = oldSettings.nsfw_responses? "Disabled" : "Enabled"
            await message.reply(`**${literal}** \`nsfw\` mode`);
            await updateGuildSettings(message.guild.id, Object.assign(oldSettings, {"nsfw_responses":!oldSettings.nsfw_responses}));
            await guildMap.get(message.guild.id).loadResponses();
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error)
        }
       
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
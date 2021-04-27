import * as Discord from 'discord.js';
import {Message} from 'discord.js';
import {editMessage as _keyword} from '../../keywords.json';
import {GeditMessage as _guide} from '../../guides.json';
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {editMessageCmd} from "../Interf/editMessageCmd";
import * as e from '../../../errorCodes.json'
import {commandType} from "../../../Entities/Generic/commandType";


@injectable()
export class EditMessageCmdImpl extends AbstractCommand implements editMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
        _keyword
    );

    async execute(
        {channel, mentions, guild, url}: Message,
        {arg1, arg2, commandless2, commandless3}: commandType,
        addGuildLog
    ): Promise<any> {

        try {
            const fetchedMessage = await channel.messages.fetch(arg1)
            const editedMessage = await fetchedMessage
                .edit(commandless2)
            await channel.send({
                embed: {
                    description: `[edited message](${editedMessage.url})`
                }
            });
            return new Promise((res, rej) => res('edit message success'));
        } catch (err) {
            if (err.code == e["Unknown message"] || err.code == e["Invalid form body"]) {
                try {
                    const targetChannel: Discord.GuildChannel = guild.channels.cache
                        .find(c => c.id == mentions.channels?.firstKey())

                    const targetMessage = await (targetChannel as Discord.TextChannel)?.messages.fetch(arg2);

                    const editedMessage = await targetMessage?.edit(commandless3);
                    const sendLinkMessage = await channel.send(new Discord.MessageEmbed(
                        {description: `[edited message](${editedMessage.url})`}
                    ));
                    return new Promise((res, rej) => res('edit message success'));
                } catch (err) {
                    return new Promise((res, rej) => rej(`edit message failed\n${url}`));
                }
            } else {
                return new Promise((res, rej) => rej(`edit message failed\nreason:${err.toString()}`));
            }
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
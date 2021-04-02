import * as Discord from 'discord.js';
import {editMessage as _keyword} from '../keywords.json';
import {GeditMessage as _guide} from '../guides.json';
import {injectable} from "inversify";
import Bundle from "../../EntitiesBundle/Bundle";
import {AbstractCommand} from "../AbstractCommand";
import {editMessageCmd} from "../Interf/editMessageCmd";
import * as e from '../../errorCodes.json'


@injectable()
export class EditMessageCmdImpl extends AbstractCommand implements editMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
        _keyword
    );

    async execute(bundle: Bundle): Promise<any> {
        const message: Discord.Message = bundle.getMessage();
        const channel: Discord.TextChannel = bundle.getChannel() as Discord.TextChannel;
        try {
            const fetchedMessage = await channel.messages.fetch(bundle.getCommand().arg1)
            const editedMessage = await fetchedMessage
                .edit(bundle.getCommand().commandless2)
            await channel.send({
                embed: {
                    description: `[edited message](${editedMessage.url})`
                }
            });
            return new Promise((res, rej) => res('edit message success'));
        }
        catch (err) {
            if (err.code == e["Unknown message"] || err.code == e["Invalid form body"]) {
                try {
                    const targetChannel : Discord.GuildChannel = message.guild.channels.cache
                        .find(c => c.id == message.mentions.channels?.firstKey())

                    const targetMessage = await (targetChannel as Discord.TextChannel)?.messages.fetch(bundle.getCommand().arg2);

                    const editedMessage = await targetMessage?.edit(bundle.getCommand().commandless3);
                    const sendLinkMessage = await channel.send(new Discord.MessageEmbed(
                        {description: `[edited message](${editedMessage.url})`}
                        ));
                    return new Promise((res, rej) => res('edit message success'));
                } catch (err) {
                    return new Promise((res, rej) => rej(`edit message failed\n${message.url}`));
                }
            }

            else{
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
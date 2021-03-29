import {injectable} from "inversify";
import {AbstractCommand} from "@Commands/AbstractCommand";
import {editMessageCmd} from '@cmdInterfaces/editMessageCmd';
import {editMessage as _keyword} from '@Commands/keywords.json';
import {GeditMessage as _guide} from '@Commands/guides.json';
import * as Discord from 'discord.js';
import * as e from '@root/errorCodes.json';
import Bundle from "@root/EntitiesBundle/Bundle";


@injectable()
export class EditMessageCmdImpl extends AbstractCommand implements editMessageCmd {
    private readonly _aliases: string[] = ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'];

    execute(bundle: Bundle): Promise<any> {
        try {
            (bundle.getChannel() as Discord.TextChannel).messages.fetch(bundle.getCommand().arg1)
                .then(message => {
                    return message.edit(bundle.getCommand().commandless2)
                        .then(editedMessage => (bundle.getChannel() as Discord.TextChannel).send({embed: {description: `[edited message](${editedMessage.url})`}}))
                })
                .catch(async err => {
                    if (err.code == e["Unknown message"]) {
                        try {
                            const targetChannel : Discord.GuildChannel = bundle.getGuild().channels.cache
                                .find(c => c.id === bundle.getMessage().mentions.channels.first().id)
                            const targetMessage = await (targetChannel as Discord.TextChannel).messages.cache
                                .find(m => m.id === bundle.getCommand().arg2);
                            const editedMessage = await targetMessage
                                .edit(bundle.getCommand().commandless3);
                            return (bundle.getChannel() as Discord.TextChannel)
                                .send(new Discord.MessageEmbed({description: `[edited message](${editedMessage.url})`}));
                        } catch (err) {
                            console.log(err);
                            this.handleError(err, bundle);
                        }
                    }
                })
        } catch (err) {
            console.log(err);
            this.handleError(err, bundle);
        }
        return new Promise((res, rej) => rej('edit message failed'));
    }

    public setAliases(aliases: string[]) {
        this._aliases = aliases;
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
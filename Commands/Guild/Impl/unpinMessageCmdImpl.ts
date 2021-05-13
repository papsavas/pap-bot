import { GunpinMessage as _guide } from "../../guides.json";
import { unpinMessage as _keyword } from "../../keywords.json";
import * as Discord from "discord.js";

import { AbstractCommand } from "../AbstractCommand";
import { unpinMessageCmd } from "../Interf/unpinMessageCmd";
import { ApplicationCommandData, CommandInteraction, GuildMember, Message, Snowflake } from "discord.js";
import { extractId } from "../../../toolbox/extractMessageId";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import * as e from '../../../errorCodes.json';
import { guildMap } from "../../..";


export class UnpinMessageCmdImpl extends AbstractCommand implements unpinMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['unpin', 'ανπιν'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'message_id',
                    description: 'targeted message id or link',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'reason',
                    description: 'reason for unpinning',
                    type: 'STRING',
                    required: false
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const channel = interaction.channel as Discord.TextChannel;
        const reason = interaction.options[1];
        const member = interaction.member as GuildMember;
        let unpinReason = reason ? reason.value as string : ``;
        unpinReason += `\nby ${member?.displayName}`;
        let pinningMessageID = extractId(interaction.options[0].value as string);
        let fetchedMessage: Message;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        } catch (error) {
            if (error.code == e["Unknown message"])
                return interaction.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`,
                    { ephemeral: true })
        }

        if (!fetchedMessage.pinned)
            return interaction.reply({
                embeds: [{ description: `[message](${fetchedMessage.url}) is not pinned` }],
                ephemeral: true
            });
        return fetchedMessage.unpin()
            .then((unpinnedMessage) => {
                //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                interaction.reply(new Discord.MessageEmbed({
                    title: `Unpinned Message 📌`,
                    description: unpinnedMessage.content?.length > 0 ?
                        `[${unpinnedMessage.content.substring(0, 40)}...](${unpinnedMessage.url})` :
                        `[Click to jump](${unpinnedMessage.url})`,
                    footer: { text: unpinReason }
                }))
            })
            .catch(err => {
                interaction.reply('could not pin message');
            });
    }

    async execute(message: Message, { arg1, commandless2 }: commandType): Promise<any> {
        const [channel, member] = [message.channel, message.member];
        let unpinReason = commandless2 ? commandless2 : `undefined`;
        unpinReason += `\nby ${member.displayName}`;
        let unpinnedMessageId = extractId(arg1);
        let fetchedMessage: Message;
        try {
            fetchedMessage = await channel.messages.fetch(unpinnedMessageId);
        } catch (error) {
            if (error.code == e["Unknown message"])
                return message.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`);
        }
        if (!fetchedMessage.pinned)
            return message.reply({ embed: { description: `[message](${fetchedMessage.url}) is not pinned` } });

        return (channel as Discord.TextChannel).messages.fetch(unpinnedMessageId)
            .then((msg) => {
                msg.unpin()
                    .then((msg) => {
                        this.addGuildLog(message.guild.id, `message unpinned:\n${msg.url} with reason ${unpinReason}`);
                        if (message.deletable)
                            message.client.setTimeout(() => message.delete().catch(), 3000);
                    });
            })
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

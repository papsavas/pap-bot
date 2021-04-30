import {GunpinMessage as _guide} from "../../guides.json";
import {unpinMessage as _keyword} from "../../keywords.json";
import * as Discord from "discord.js";
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {unpinMessageCmd} from "../Interf/unpinMessageCmd";
import {ApplicationCommandData, CommandInteraction, Message} from "discord.js";
import {extractId} from "../../../toolbox/toolbox";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";

injectable()

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

    async interactiveExecute(interaction: CommandInteraction):Promise<any>{
        const channel = interaction.channel as Discord.TextChannel;
        const reason = interaction.options[1];
        let unpinReason = reason ? reason.value as string : ``;
        unpinReason += `\nby ${interaction.member.displayName}`;
        let pinningMessageID = extractId(interaction.options[0].value as string);
        const fetchedMessage = await channel.messages.fetch(pinningMessageID);    
        return fetchedMessage.unpin({reason: unpinReason})
            .then((pinnedMessage) => {
                //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                interaction.reply(new Discord.MessageEmbed({
                    title:`Unpinned Message 📌`,
                    description: `[unpinned message](${pinnedMessage.url})`
                }))
            })
            .catch(err=> {
                interaction.reply('could not pin message');
            });
    }

    execute(message: Message, {arg1, commandless2}: commandType, addGuildLog: guildLoggerType): Promise<any> {
        const [channel, member] = [message.channel, message.member];
        let unpinReason = commandless2 ? commandless2 : `undefined`;
        unpinReason += `\nby ${member.displayName}`;
        let id = extractId(arg1);
        return (channel as Discord.TextChannel).messages.fetch(id)
            .then((msg) => {
                msg.unpin({reason: unpinReason})
                    .then((msg) => {
                        //addGuildLog(`message unpinned:\n${msg.url} with reason ${unpinReason}`);
                        if (message.deletable)
                            message.client.setTimeout(()=> message.delete().catch(), 3000);
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
}

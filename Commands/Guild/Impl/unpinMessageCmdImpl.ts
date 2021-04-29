import {GunpinMessage as _guide} from "../../guides.json";
import {unpinMessage as _keyword} from "../../keywords.json";
import * as Discord from "discord.js";
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {unpinMessageCmd} from "../Interf/unpinMessageCmd";
import {Message} from "discord.js";
import {extractId} from "../../../toolbox";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";

injectable()

export class UnpinMessageCmdImpl extends AbstractCommand implements unpinMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['unpin', 'ανπιν'],
        _keyword
    );

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

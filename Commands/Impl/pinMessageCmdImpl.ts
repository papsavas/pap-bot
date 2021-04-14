import {GunpinMessage as _guide} from "../guides.json";
import {pinMessage as _keyword} from "../keywords.json";
import {injectable} from "inversify";
import Bundle from "../../BundlePackage/Bundle";
import {pinMessageCmd} from "../Interf/pinMessageCmd";
import {AbstractCommand} from "../AbstractCommand";
import {Message} from "discord.js";
import {commandType, guildLoggerType} from "../../Entities";
import {extractId} from "../../toolbox";


@injectable()
export class PinMessageCmdImpl extends AbstractCommand implements pinMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['pin', 'πιν'],
        _keyword
    );

    execute(message, {arg1, commandless2}: commandType, addGuildLog: guildLoggerType): Promise<any> {
        const channel = message.channel;
        let pinReason =commandless2 ? commandless2 : ``;
        pinReason += `\nby ${message.member.displayName}`;
        let pinningMessageID = extractId(arg1);
        return channel.messages.fetch(pinningMessageID)
            .then((fetchedMessage) => {
                fetchedMessage.pin({reason: pinReason})
                    .then((pinnedMessage) => {
                        addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                        message.react('👌').catch();
                        if(message.deletable)
                            message.delete({timeout:5000}).catch();
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

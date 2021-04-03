import * as Discord from 'discord.js';
import {GunpinMessage as _guide} from "../guides.json";
import {pinMessage as _keyword} from "../keywords.json";
import {injectable} from "inversify";
import Bundle from "../../EntitiesBundle/Bundle";
import {pinMessageCmd} from "../Interf/pinMessageCmd";
import {AbstractCommand} from "../AbstractCommand";


@injectable()
export class PinMessageCmdImpl extends AbstractCommand implements pinMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['pin', 'πιν'],
        _keyword
    );

    execute(bundle: Bundle): Promise<any> {
        const message = bundle.getMessage();
        const channel = message.channel;
        let pinReason = bundle.getCommand().commandless2 ? bundle.getCommand().commandless2 : ``;
        pinReason += `\nby ${bundle.getMember().displayName}`;
        let pinningMessageID = bundle.extractId(bundle.getCommand().arg1);
        return channel.messages.fetch(pinningMessageID)
            .then((fetchedMessage) => {
                fetchedMessage.pin({reason: pinReason})
                    .then((pinnedMessage) => {
                        bundle.addLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
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

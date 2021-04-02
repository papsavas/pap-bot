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
        let pinReason = bundle.getCommand().commandless2 ? bundle.getCommand().commandless2 : ``;
        pinReason += `\nby ${bundle.getMember().displayName}`;
        let arg1 = bundle.extractId(bundle.getCommand().arg1);
        return (bundle.getChannel() as Discord.TextChannel).messages.fetch(arg1)
            .then((msg) => {
                msg.pin({reason: pinReason})
                    .then((msg) => {
                        bundle.addLog(`message pinned:\n${msg.url} with reason ${pinReason}`);
                        bundle.getMessage().react('👌').catch(err => this.handleError(err, bundle));
                        if(bundle.getMessage().deletable)
                            bundle.getMessage().delete({timeout:5000}).catch(err => this.handleError(err, bundle));
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

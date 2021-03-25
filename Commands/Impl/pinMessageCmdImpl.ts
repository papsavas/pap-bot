import * as Discord from 'discord.js';
import {injectable} from "inversify";
import {AbstractCommand} from "@Commands/AbstractCommand";
import {pinMessageCmd} from "@cmdInterfaces/pinMessageCmd";
import {GunpinMessage as _guide} from "@Commands/guides.json";
import {pinMessage as _keyword} from "@Commands/keywords.json";
import {logsChannel} from "@root/index";
import Bundle from "@root/EntitiesBundle/Bundle";

@injectable()
export class PinMessageCmdImpl extends AbstractCommand implements pinMessageCmd {
    private readonly _aliases: string[] = ['pin', 'πιν'];

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

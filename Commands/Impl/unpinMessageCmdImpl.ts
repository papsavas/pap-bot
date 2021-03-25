import {injectable} from "inversify";
import {AbstractCommand} from "@Commands/AbstractCommand";
import {unpinMessageCmd} from "@cmdInterfaces/unpinMessageCmd";
import {GunpinMessage as _guide} from "@Commands/guides.json";
import {unpinMessage as _keyword} from "@Commands/keywords.json";
import Bundle from "@root/EntitiesBundle/Bundle";
import * as Discord from "discord.js";
import {logsChannel} from "@root/index";

injectable()
export class UnpinMessageCmdImpl extends AbstractCommand implements unpinMessageCmd {
    private readonly _aliases: string[] = ['unpin', 'ανπιν'];

    execute(bundle: Bundle): Promise<any> {
        let unpinReason = bundle.getCommand().commandless2 ? bundle.getCommand().commandless2 : `undefined`;
        unpinReason += `\nby ${bundle.getMember().displayName}`;
        let arg1 = bundle.extractId(bundle.getCommand().arg1);
        return (bundle.getChannel() as Discord.TextChannel).messages.fetch(arg1)
            .then((msg) => {
                msg.unpin({reason: unpinReason})
                    .then((msg) => {
                        bundle.addLog(`message unpinned:\n${msg.url} with reason ${unpinReason}`);
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

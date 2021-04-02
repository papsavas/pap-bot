import * as Discord from 'discord.js';
import {dmMember as _keyword} from '../keywords.json';
import {GdmMember as _guide} from '../guides.json';
import {injectable} from "inversify";
import Bundle from "../../EntitiesBundle/Bundle";
import {AbstractCommand} from "../AbstractCommand";
import {dmMemberCmd} from "../Interf/dmMemberCmd";


@injectable()
export class DmMemberCmdImpl extends AbstractCommand implements dmMemberCmd {
    private readonly _aliases = ['directmessage', 'message', 'dm'];

    execute(bundle: Bundle) {
        return (bundle.getMessage().mentions.members.first() as Discord.GuildMember).send(bundle.getCommand().commandless2);
    }

    getKeyword(): string {
        return _keyword;
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }


}
import {AbstractCommand} from "@Commands/AbstractCommand";
import * as Discord from 'discord.js';
import {dmMember as _keyword} from '@Commands/keywords.json';
import {GdmMember as _guide} from '@Commands/guides.json';
import {dmMemberCmd} from '@cmdInterfaces/dmMemberCmd';
import {injectable} from "inversify";
import "reflect-metadata";
import Bundle from "@root/EntitiesBundle/Bundle";

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
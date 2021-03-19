import {AbstractCommand} from "../AbstractCommand";
import * as Discord from 'discord.js';
import {dmMember as dmMemberKeyword} from '../keywords.json';
import {GdmMember as dmGuide} from '../guides.json';
import {dmMember} from "../Interf/dmMemberCmd";
import {injectable} from "inversify";
import "reflect-metadata";
import Bundle from "../../EntitiesBundle/Bundle";

@injectable()
export class DmMemberImpl extends AbstractCommand implements dmMember {
    private readonly aliases = ['directmessage', 'message', 'dm'];

    execute(bundle: Bundle) {
        return (bundle.getMessage().mentions.members.first() as Discord.GuildMember).send(bundle.getCommand().commandless2);
    }

    getKeyword(): string {
        return dmMemberKeyword;
    }

    getAliases(): string[] {
        return this.aliases;
    }

    getGuide(): string {
        return dmGuide;
    }


}
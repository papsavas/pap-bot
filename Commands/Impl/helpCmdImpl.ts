import { AbstractCommand } from "../AbstractCommand";
import * as Discord from 'discord.js';
import { help as helpKeyword } from '../keywords.json';
import { Ghelp as helpGuide } from '../guides.json';
import { helpCmd } from "../Interf/helpCmd";
import { injectable } from "inversify";
import "reflect-metadata";
import { commandType } from "../../Entities/CommandType";
import Bundle from "../../EntitiesBundle/Bundle";

@injectable()
export class HelpCmdImpl extends AbstractCommand implements helpCmd {
    private readonly aliases = ['help', 'h', 'halp'];

    execute(bundle: Bundle) {
        return (bundle.getChannel() as Discord.TextChannel | Discord.DMChannel).send('help is here');
    }

    getKeyword(): string {
        return helpKeyword;
    }

    getAliases(): string[] {
        return this.aliases;
    }

    getGuide(): string {
        return helpGuide;
    }


}
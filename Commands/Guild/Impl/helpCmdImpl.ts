import {AbstractCommand} from "../AbstractCommand";
import {help as _keyword} from '../../keywords.json';
import {Ghelp as _guide} from '../../guides.json';
import {helpCmd} from "../Interf/helpCmd";
import {injectable} from "Inversify";
import "reflect-metadata";
import { ApplicationCommandData } from "discord.js";

@injectable()
export class HelpCmdImpl extends AbstractCommand implements helpCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['help', 'halp', 'h'],
        _keyword
    );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
        }
    }
    
    execute(message, command, addGuildLog) {
        return (message.channel).send('help is here');
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
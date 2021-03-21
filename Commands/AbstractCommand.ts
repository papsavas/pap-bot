import { injectable } from "inversify";
import { GenericCommand } from "./GenericCommand";
import "reflect-metadata";
import { commandType } from "../Entities/CommandType";
import Bundle from "../EntitiesBundle/Bundle";

@injectable()
export abstract class AbstractCommand implements GenericCommand {
    abstract execute(bundle: Bundle): Promise<any>;
    abstract getKeyword(): string;
    abstract getAliases(): string[];
    abstract getGuide(): string;
    constructor(aliases: string[], keyword: string) {
        if(aliases.every(alias => alias !== keyword))
            aliases.push(keyword)
    }
    matchAliases(possibleCommand: string): boolean {
        return !!this.getAliases()
            .find((alias: string) => alias === possibleCommand.toLowerCase());
    }
}
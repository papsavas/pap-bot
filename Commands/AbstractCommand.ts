import { injectable } from "inversify";
import { GenericCommand } from "./GenericCommand";
import "reflect-metadata";
import { commandType } from "../Entities/CommandType";
import Bundle from "../Bundle";

@injectable()
export abstract class AbstractCommand implements GenericCommand {
    abstract execute(bundle: typeof Bundle): void;
    abstract getKeyword(): string;
    abstract getAliases(): string[];
    abstract getGuide(): string;
    matchAliases(possibleCommand: string): boolean {
        return !!this.getAliases()
            .find((alias: string) => alias === possibleCommand.toLowerCase());
    }
}
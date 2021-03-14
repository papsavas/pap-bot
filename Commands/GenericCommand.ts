import Bundle from "../Bundle";
import { commandType } from "../Entities/CommandType";

export interface GenericCommand {
    execute(bundle :typeof Bundle): void;
    getGuide(): string;
    getKeyword(): string;
    matchAliases(possibleCommand: string): boolean;
}
import Bundle from "../EntitiesBundle/Bundle";
import BundleImpl from "../EntitiesBundle/BundleImpl";
import { commandType } from "../Entities/CommandType";

export interface GenericCommand {
    execute(bundle : Bundle): void;
    getGuide(): string;
    getKeyword(): string;
    matchAliases(possibleCommand: string): boolean;
}
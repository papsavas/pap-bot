import Bundle from "../EntitiesBundle/Bundle";
import BundleImpl from "../EntitiesBundle/BundleImpl";
import { commandType } from "../Entities/CommandType";

export interface GenericCommand {
    execute(bundle : Bundle): Promise<any>;
    getGuide(): string;
    //getKeyword(): string;
    //getAliases(): string[];
    matchAliases(possibleCommand: string): boolean;
}
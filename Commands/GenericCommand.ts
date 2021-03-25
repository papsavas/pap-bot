import Bundle from "@root/EntitiesBundle/Bundle";
import { commandType } from "../Entities/CommandType";

export interface GenericCommand {
    execute(bundle : Bundle): Promise<any>;
    getGuide(): string;
    //getKeyword(): string;
    //getAliases(): string[];
    matchAliases(possibleCommand: string): boolean;
    handleError(err : Error, bundle :Bundle): void;
}
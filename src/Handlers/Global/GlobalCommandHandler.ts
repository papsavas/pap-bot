import { GlobalCommandManager } from "../../Commands/Managers/Interf/GlobalCommandManager";
import GenericHandler from "../GenericHandler";

export interface GlobalCommandHandler extends GenericHandler {
    readonly commandManager: GlobalCommandManager

}
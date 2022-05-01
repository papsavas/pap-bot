import { GlobalCommandHandlerImpl } from "../Handlers/Global/GlobalCommandHandlerImpl";
import { fetchGlobalCommandIds } from "../Queries/Generic/Commands";

export const globalCommandHandler = await GlobalCommandHandlerImpl.init();
export const globalCommandsIDs = await fetchGlobalCommandIds();
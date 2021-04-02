import { Container } from "inversify";
import { helpCmd } from "../Commands/Interf/helpCmd";
import { HelpCmdImpl } from "../Commands/Impl/helpCmdImpl";
import { PollCmdImpl } from "../Commands/Impl/pollCmdImpl";
import { pollCmd } from "../Commands/Interf/pollCmd";
import {messageChannelCmd} from "../Commands/Interf/messageChannelCmd"
import {dmMemberCmd} from "../Commands/Interf/dmMemberCmd"
import { TYPES } from "./Types";
import CommandHandlerImpl from "../Commands/CommandHandlerImpl";
import {CommandHandler} from "../Commands/CommandHandler";
import {DmMemberCmdImpl} from "../Commands/Impl/dmMemberCmdImpl";
import {MessageChannelCmdImpl} from '../Commands/Impl/messageChannelCmdImpl';
import {PinMessageCmdImpl} from "../Commands/Impl/pinMessageCmdImpl";
import {pinMessageCmd} from "../Commands/Interf/pinMessageCmd";
import {unpinMessageCmd} from "../Commands/Interf/unpinMessageCmd";
import {UnpinMessageCmdImpl} from "../Commands/Impl/unpinMessageCmdImpl";
import {EditMessageCmdImpl} from "../Commands/Impl/editMessageCmdImpl";
import {editMessageCmd} from "../Commands/Interf/editMessageCmd";

const container = new Container();
container.bind<helpCmd>(TYPES.HelpCmd).to(HelpCmdImpl).inSingletonScope();
container.bind<pollCmd>(TYPES.PollCmd).to(PollCmdImpl).inSingletonScope();
container.bind<dmMemberCmd>(TYPES.DmMemberCmd).to(DmMemberCmdImpl).inSingletonScope();
container.bind<messageChannelCmd>(TYPES.MessageChannelCmd).to(MessageChannelCmdImpl).inSingletonScope();
container.bind<pinMessageCmd>(TYPES.PinMessageCmd).to(PinMessageCmdImpl).inSingletonScope();
container.bind<unpinMessageCmd>(TYPES.UnpinMessageCmd).to(UnpinMessageCmdImpl).inSingletonScope();
container.bind<editMessageCmd>(TYPES.EditMessageCmd).to(EditMessageCmdImpl).inSingletonScope();

container.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandlerImpl).inSingletonScope();

export default container;
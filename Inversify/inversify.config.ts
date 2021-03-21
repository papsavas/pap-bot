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
import {DmMemberImpl} from "../Commands/Impl/dmMemberImpl";
import {MessageChannelCmdImpl} from "../Commands/Impl/messageChannelCmdImpl";

const container = new Container();
container.bind<helpCmd>(TYPES.HelpCmd).to(HelpCmdImpl).inSingletonScope();
container.bind<pollCmd>(TYPES.PollCmd).to(PollCmdImpl).inSingletonScope();
container.bind<dmMemberCmd>(TYPES.DmMemberCmd).to(DmMemberImpl).inSingletonScope();
container.bind<messageChannelCmd>(TYPES.MessageChannelCmd).to(MessageChannelCmdImpl).inSingletonScope();

container.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandlerImpl).inSingletonScope();

export default container;
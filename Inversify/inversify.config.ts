import { Container } from "inversify";
import { helpCmd } from "@cmdInterfaces/helpCmd";
import { HelpCmdImpl } from "@Commands/Impl/helpCmdImpl";
import { PollCmdImpl } from "@Commands/Impl/pollCmdImpl";
import { pollCmd } from "@cmdInterfaces/pollCmd";
import {messageChannelCmd} from "@cmdInterfaces/messageChannelCmd"
import {dmMemberCmd} from "@cmdInterfaces/dmMemberCmd"
import { TYPES } from "./Types";
import CommandHandlerImpl from "@Commands/CommandHandlerImpl";
import {CommandHandler} from "@Commands/CommandHandler";
import {DmMemberCmdImpl} from "@Commands/Impl/dmMemberCmdImpl";
import {MessageChannelCmdImpl} from '@cmdImplementations/messageChannelCmdImpl';
import {PinMessageCmdImpl} from "@Commands/Impl/pinMessageCmdImpl";
import {pinMessageCmd} from "@cmdInterfaces/pinMessageCmd";
import {unpinMessageCmd} from "@cmdInterfaces/unpinMessageCmd";
import {UnpinMessageCmdImpl} from "@Commands/Impl/unpinMessageCmdImpl";

const container = new Container();
container.bind<helpCmd>(TYPES.HelpCmd).to(HelpCmdImpl).inSingletonScope();
container.bind<pollCmd>(TYPES.PollCmd).to(PollCmdImpl).inSingletonScope();
container.bind<dmMemberCmd>(TYPES.DmMemberCmd).to(DmMemberCmdImpl).inSingletonScope();
container.bind<messageChannelCmd>(TYPES.MessageChannelCmd).to(MessageChannelCmdImpl).inSingletonScope();
container.bind<pinMessageCmd>(TYPES.PinMessageCmd).to(PinMessageCmdImpl).inSingletonScope();
container.bind<unpinMessageCmd>(TYPES.UnpinMessageCmd).to(UnpinMessageCmdImpl).inSingletonScope();

container.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandlerImpl).inSingletonScope();

export default container;
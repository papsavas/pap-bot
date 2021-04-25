import {Container} from "inversify";
import {helpCmd} from "../Commands/Guild/Interf/helpCmd";
import {HelpCmdImpl} from "../Commands/Guild/Impl/helpCmdImpl";
import {PollCmdImpl} from "../Commands/Guild/Impl/pollCmdImpl";
import {pollCmd} from "../Commands/Guild/Interf/pollCmd";
import {messageChannelCmd} from "../Commands/Guild/Interf/messageChannelCmd"
import {dmMemberCmd} from "../Commands/Guild/Interf/dmMemberCmd"
import {TYPES} from "./Types";
import CommandHandlerImpl from "../Commands/Guild/CommandHandlerImpl";
import {CommandHandler} from "../Commands/Guild/CommandHandler";
import {DmMemberCmdImpl} from "../Commands/Guild/Impl/dmMemberCmdImpl";
import {MessageChannelCmdImpl} from '../Commands/Guild/Impl/messageChannelCmdImpl';
import {PinMessageCmdImpl} from "../Commands/Guild/Impl/pinMessageCmdImpl";
import {pinMessageCmd} from "../Commands/Guild/Interf/pinMessageCmd";
import {unpinMessageCmd} from "../Commands/Guild/Interf/unpinMessageCmd";
import {UnpinMessageCmdImpl} from "../Commands/Guild/Impl/unpinMessageCmdImpl";
import {EditMessageCmdImpl} from "../Commands/Guild/Impl/editMessageCmdImpl";
import {editMessageCmd} from "../Commands/Guild/Interf/editMessageCmd";
import {SetPrefixCmdImpl} from "../Commands/Guild/Impl/setPrefixCmdImpl";
import {setPrefixCmd} from "../Commands/Guild/Interf/setPrefixCmd";
import {SetPermsCmdImpl} from "../Commands/Guild/Impl/setPermsCmdImpl";
import {setPermsCmd} from "../Commands/Guild/Interf/setPermsCmd";
import {ShowPermsCmdsImpl} from "../Commands/Guild/Impl/showPermsCmdsImpl";
import {showPermsCmd} from "../Commands/Guild/Interf/showPermsCmd";
import {AddResponseCmdImpl} from "../Commands/Guild/Impl/addResponseCmdImpl";
import {addResponseCmd} from "../Commands/Guild/Interf/addResponseCmd";
import {ShowPersonalResponsesCmdImpl} from "../Commands/Guild/Impl/showPersonalResponsesCmdImpl";
import {showPersonalResponsesCmd} from "../Commands/Guild/Interf/showPersonalResponsesCmd";
import {ClearMessagesCmdImpl} from "../Commands/Guild/Impl/clearMessagesCmdImpl";
import {clearMessagesCmd} from "../Commands/Guild/Interf/clearMessagesCmd";
import {removePersonalResponseCmd} from "../Commands/Guild/Interf/removePersonalResponseCmd";
import {RemovePersonalResponseCmdImpl} from "../Commands/Guild/Impl/removePersonalResponseCmdImpl";

const container = new Container();
container.bind<helpCmd>(TYPES.HelpCmd).to(HelpCmdImpl).inSingletonScope();
container.bind<pollCmd>(TYPES.PollCmd).to(PollCmdImpl).inSingletonScope();
container.bind<dmMemberCmd>(TYPES.DmMemberCmd).to(DmMemberCmdImpl).inSingletonScope();
container.bind<messageChannelCmd>(TYPES.MessageChannelCmd).to(MessageChannelCmdImpl).inSingletonScope();
container.bind<pinMessageCmd>(TYPES.PinMessageCmd).to(PinMessageCmdImpl).inSingletonScope();
container.bind<unpinMessageCmd>(TYPES.UnpinMessageCmd).to(UnpinMessageCmdImpl).inSingletonScope();
container.bind<editMessageCmd>(TYPES.EditMessageCmd).to(EditMessageCmdImpl).inSingletonScope();
container.bind<setPrefixCmd>(TYPES.SetPrefixCmd).to(SetPrefixCmdImpl).inSingletonScope();
container.bind<setPermsCmd>(TYPES.SetPermsCmd).to(SetPermsCmdImpl).inSingletonScope();
container.bind<showPermsCmd>(TYPES.ShowPermsCmd).to(ShowPermsCmdsImpl).inSingletonScope();
container.bind<addResponseCmd>(TYPES.AddResponseCmd).to(AddResponseCmdImpl).inSingletonScope();
container.bind<showPersonalResponsesCmd>(TYPES.ShowPersonalResponsesCmd).to(ShowPersonalResponsesCmdImpl).inSingletonScope();
container.bind<clearMessagesCmd>(TYPES.ClearMessagesCmd).to(ClearMessagesCmdImpl).inSingletonScope();
container.bind<removePersonalResponseCmd>(TYPES.RemovePersonalResponseCmd).to(RemovePersonalResponseCmdImpl).inSingletonScope();

container.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandlerImpl).inSingletonScope();

export default container;
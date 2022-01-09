
import { ApplicationCommandData } from 'discord.js';
import { CommandScope } from '../../Entities/Generic/command';
import { AbstractCommand } from "../AbstractCommand";
import { GenericGlobalCommand } from "./GenericGlobalCommand";

export abstract class AbstractGlobalCommand extends AbstractCommand implements GenericGlobalCommand {
    readonly type = CommandScope.GLOBAL;
    abstract getCommandData(): ApplicationCommandData;

}
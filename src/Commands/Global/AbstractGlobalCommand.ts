
import { ApplicationCommandData } from 'discord.js';
import "reflect-metadata";
import { CommandScope } from '../../Entities/Generic/command';
import { AbstractCommand } from "../AbstractCommand";
import { GenericGlobalCommand } from "./GenericGlobalCommand";

export abstract class AbstractGlobalCommand extends AbstractCommand implements GenericGlobalCommand {
    protected _type = CommandScope.GLOBAL;
    abstract getCommandData(): ApplicationCommandData;

}
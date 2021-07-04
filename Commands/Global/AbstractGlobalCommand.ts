
import { ApplicationCommandData } from 'discord.js';
import "reflect-metadata";
import { commandSpecifier } from '../../Entities/Generic/commandType';
import { AbstractCommand } from "../AbstractCommand";
import GenericGlobalCommand from "./GenericGlobalCommand";

export abstract class AbstractGlobalCommand extends AbstractCommand implements GenericGlobalCommand {
    protected _type = commandSpecifier.GLOBAL;
    abstract getCommandData(): ApplicationCommandData;

}
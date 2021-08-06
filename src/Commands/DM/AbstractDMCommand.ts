
import { ApplicationCommandData } from 'discord.js';
import { commandSpecifier } from '../../Entities/Generic/command';
import { AbstractCommand } from "../AbstractCommand";
import { GenericDMCommand } from './GenericDMCommand';

export abstract class AbstractDMCommand extends AbstractCommand implements GenericDMCommand {
    protected _type = commandSpecifier.DM
    abstract getCommandData(): ApplicationCommandData;

}
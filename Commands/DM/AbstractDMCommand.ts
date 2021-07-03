
import { ApplicationCommandData } from 'discord.js';
import "reflect-metadata";
import { AbstractCommand } from "../AbstractCommand";
import GenericDMCommand from './GenericDMCommand';

export abstract class AbstractDMCommand extends AbstractCommand implements GenericDMCommand {
    abstract getCommandData(): ApplicationCommandData;

}
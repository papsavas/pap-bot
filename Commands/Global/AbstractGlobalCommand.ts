
import { ApplicationCommandData } from 'discord.js';
import "reflect-metadata";
import { AbstractCommand } from "../AbstractCommand";
import GenericGlobalCommand from "./GenericGlobalCommand";

export abstract class AbstractGlobalCommand extends AbstractCommand implements GenericGlobalCommand {

    abstract getCommandData(): ApplicationCommandData;

}
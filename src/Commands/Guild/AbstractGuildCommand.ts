
import { ApplicationCommandData, Snowflake } from 'discord.js';
import "reflect-metadata";
import { CommandScope } from '../../Entities/Generic/command';
import { AbstractCommand } from "../AbstractCommand";
import { GenericGuildCommand } from "./GenericGuildCommand";

export abstract class AbstractGuildCommand extends AbstractCommand implements GenericGuildCommand {
    protected _type = CommandScope.GUILD;

    abstract getCommandData(guildID: Snowflake): ApplicationCommandData;
}
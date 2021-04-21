import * as Discord from 'discord.js';
import {AbstractGuild} from "../AbstractGuild";
import {GenericGuild} from "../GenericGuild";

export class DefaultGuild extends AbstractGuild implements GenericGuild {
    constructor(id: Discord.Snowflake) {
        super(id);
    }
}
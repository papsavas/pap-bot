import * as Discord from 'discord.js';
import {AbstractGuild} from "../AbstractGuild";
import {GenericGuild} from "../GenericGuild";

export class DefaultGuild extends AbstractGuild implements GenericGuild {
    constructor(id: Discord.Snowflake) {
        super(id);
        this.responses = ['ss', 'hey'];
    }

    onMessage(message: Discord.Message): Promise<any> {
        return super.onMessage(message);
    }
}
import * as Discord from 'discord.js';
import {AbstractGuild} from "../AbstractGuild";
import {GenericGuild} from "../GenericGuild";

export class DefaultGuild extends AbstractGuild implements GenericGuild {
    constructor(id: Discord.Snowflake) {
        super(id);
    }

    returnResponses(): string[] { //depreciated, userResponses is undefined here
        return Object.values(this.userResponses).flat(1)
            .concat(this.lightResponses);
    }

}
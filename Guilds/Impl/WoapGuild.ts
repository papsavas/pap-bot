import * as Discord from 'discord.js';
import {AbstractGuild} from "../AbstractGuild";
import {GenericGuild} from "../GenericGuild";

export class WoapGuild extends AbstractGuild implements GenericGuild {
    constructor(id: Discord.Snowflake) {
        super(id);
    }

    returnResponses(): string[] {
        return Object.values(this.userResponses).flat(1)
            .concat([...this.heavyResponses, ...this.lightResponses]);
    }
}
import { Snowflake } from "discord.js";

export function extractId(s: string): Snowflake {
    if (s.includes('/')) { //extract id from msg link
        const linkContents = s.split('/');
        s = linkContents[linkContents.length - 1];
    }
    return s;
}

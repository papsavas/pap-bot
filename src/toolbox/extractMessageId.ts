import { Snowflake } from "discord.js";

/**
 * Extract id.
 * Given a message link or an id, it returns the id.
 * @param {string} s Discord message link or id
 * */
export function extractId(s: string): Snowflake {
    if (s.includes('/')) { //extract id from msg link
        const linkContents = s.split('/');
        s = linkContents[linkContents.length - 1];
    }
    return s as Snowflake;
}

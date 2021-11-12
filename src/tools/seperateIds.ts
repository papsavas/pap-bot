import { Message, Snowflake } from "discord.js";

/**
 * Extract id.
 * Given a message link or an id, it returns the id.
 * @param {Message['url']} s Discord message link or id
 * @returns {[Snowflake, Snowflake, Snowflake]} [guildId, channelId, messageId]
 * */
export function separateIds(link: Message['url']): [Snowflake, Snowflake, Snowflake] {
    const s = link.split('/');
    const l = s.length;
    return [
        s[l - 3],
        s[l - 2],
        s[l - 1]
    ];

}

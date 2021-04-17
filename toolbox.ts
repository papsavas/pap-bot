import {Snowflake} from "discord.js";
import {randomInt} from "crypto";

export function extractId(s:string): Snowflake {
    if (s.includes('/')) { //extract id from msg link
        const linkContents = s.split('/');
        s = linkContents[linkContents.length - 1];
    }
    return s;
}

export function randArrElement(arr: unknown[]): unknown{
    return arr.length > 1 ? arr[randomInt(0, arr.length)] : arr[0];
}
import { Snowflake } from "discord.js";
import { randomInt } from "crypto";


export function randomArrayValue(arr: unknown[]): unknown {
    return arr.length > 1 ? arr[randomInt(0, arr.length)] : arr[0];
}
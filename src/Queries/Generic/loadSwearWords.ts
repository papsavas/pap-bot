import {fetchTable} from "../../../DB/CoreRepo";

export function loadSwearWords(): Promise<string[]>{
    return fetchTable('swear_words', ['swear_word']) as unknown as Promise<string[]>;
}
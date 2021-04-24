import {fetchTable} from "../../DB/AbstractRepository";

export function loadSwearWords(): Promise<string[]>{
    return fetchTable('swear_words', ['swear_word']) as unknown as Promise<string[]>;
}
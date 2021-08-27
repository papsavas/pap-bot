import { findAll } from "../../DB/GenericCRUD";


export async function loadSwearWords(): Promise<string[]> {
    return (await findAll('swear_words', true))
        .map(res => res['swear_word']);
}
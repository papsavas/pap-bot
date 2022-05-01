const { keywordsTable } = (await import("../../../values/generic/DB.json", { assert: { type: 'json' } })).default;
import { deleteBatch, findAll, saveBatch } from "../../DB/GenericCRUD";

async function fetchKeywords(): Promise<string[]> {
    return (await findAll(keywordsTable, true)).
        map(k => k['keyword']);
}

function setKeywords(keywords: string[]) {
    return deleteBatch(keywordsTable, true)
        .then(() => addKeywords(keywords));
}

function addKeywords(keywords: string[]) {
    return saveBatch(keywordsTable, keywords.map(keyword => ({ keyword })));
}

export { fetchKeywords, addKeywords, setKeywords };


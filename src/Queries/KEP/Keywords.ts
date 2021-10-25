import { keywordsTable } from "../../../values/generic/DB.json";
import { deleteBatch, findAll, saveBatch } from "../../DB/GenericCRUD";

function fetchKeywords() {
    return findAll(keywordsTable, true);
}

function setKeywords(keywords: string[]) {
    return deleteBatch(keywordsTable, true)
        .then(() => addKeywords(keywords));
}

function addKeywords(keywords: string[]) {
    return saveBatch(keywordsTable, keywords.map(keyword => ({ keyword })));
}

export { fetchKeywords, addKeywords, setKeywords };


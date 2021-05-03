"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSwearWords = void 0;
const CoreRepo_1 = require("../../DB/CoreRepo");
function loadSwearWords() {
    return CoreRepo_1.fetchTable('swear_words', ['swear_word']);
}
exports.loadSwearWords = loadSwearWords;

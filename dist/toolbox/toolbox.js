"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randArrElement = exports.extractId = void 0;
const crypto_1 = require("crypto");
function extractId(s) {
    if (s.includes('/')) { //extract id from msg link
        const linkContents = s.split('/');
        s = linkContents[linkContents.length - 1];
    }
    return s;
}
exports.extractId = extractId;
function randArrElement(arr) {
    return arr.length > 1 ? arr[crypto_1.randomInt(0, arr.length)] : arr[0];
}
exports.randArrElement = randArrElement;

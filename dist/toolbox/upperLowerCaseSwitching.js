"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function UpperLowerCaseSwitching(text) {
    let newWord = '';
    const word = text;
    let upperNum = 0;
    const mid = 0.5;
    for (var i = 0; i < word.length; i++) {
        if (word[i] === ' ') {
            newWord += word[i];
            continue;
        }
        let diff = Math.pow(mid, Math.abs(upperNum));
        let num = mid;
        if (upperNum >= 0) {
            num = 1 - diff;
        }
        else {
            num = diff;
        }
        const rand = Math.random();
        const isUpper = rand > num;
        upperNum += isUpper ? 1 : -1;
        newWord += (isUpper) ? word[i].toUpperCase() : word[i].toLowerCase();
    }
    return newWord;
}
exports.default = UpperLowerCaseSwitching;

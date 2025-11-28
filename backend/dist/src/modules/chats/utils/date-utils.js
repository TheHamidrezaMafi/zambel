"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDate = parseDate;
const moment_jalaali_1 = __importDefault(require("moment-jalaali"));
function parseDate(dateString) {
    const formats = [
        'jYYYY/jMM/jDD',
        'jYYYY-jMM-jDD',
        'YYYY/MM/DD',
        'YYYY-MM-DD',
        'jMMMM jD',
        'MMMM D',
    ];
    for (const format of formats) {
        const date = (0, moment_jalaali_1.default)(dateString, format, true);
        if (date.isValid()) {
            return date.toDate();
        }
    }
    return undefined;
}
//# sourceMappingURL=date-utils.js.map
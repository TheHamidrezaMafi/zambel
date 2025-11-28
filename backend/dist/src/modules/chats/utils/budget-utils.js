"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBudget = parseBudget;
function parseBudget(budgetString) {
    const match = budgetString.match(/(\d+(,\d+)*)\s*(تومان|دلار|ریال)/i);
    if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const currency = match[3].toLowerCase();
        if (currency === 'تومان' || currency === 'ریال') {
            return amount;
        }
        else if (currency === 'دلار') {
            return amount * 30000;
        }
    }
    return undefined;
}
//# sourceMappingURL=budget-utils.js.map
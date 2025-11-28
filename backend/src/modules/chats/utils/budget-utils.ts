export function parseBudget(budgetString: string): number | undefined {
  const match = budgetString.match(/(\d+(,\d+)*)\s*(تومان|دلار|ریال)/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const currency = match[3].toLowerCase();
    if (currency === 'تومان' || currency === 'ریال') {
      return amount; // تومان یا ریال
    } else if (currency === 'دلار') {
      return amount * 30000; // تبدیل دلار به تومان (فرضی)
    }
  }

  return undefined;
}

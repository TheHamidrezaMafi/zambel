import moment from 'moment-jalaali';

export function parseDate(dateString: string): Date | undefined {
  const formats = [
    'jYYYY/jMM/jDD', // فرمت تاریخ شمسی (1402/10/15)
    'jYYYY-jMM-jDD', // فرمت تاریخ شمسی (1402-10-15)
    'YYYY/MM/DD', // فرمت تاریخ میلادی (2023/12/25)
    'YYYY-MM-DD', // فرمت تاریخ میلادی (2023-12-25)
    'jMMMM jD', // فرمت متنی شمسی (دی 15)
    'MMMM D', // فرمت متنی میلادی (December 25)
  ];

  for (const format of formats) {
    const date = moment(dateString, format, true);
    if (date.isValid()) {
      return date.toDate();
    }
  }

  return undefined;
}

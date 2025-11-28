import { FlightData } from '@/types/flight-response';
import moment from 'moment-jalaali';

export const convertPersianToEnglishNumbers = (input: string): string => {
  const persianNumbers = '۰۱۲۳۴۵۶۷۸۹';
  const englishNumbers = '0123456789';

  return input?.replace(/[۰-۹]/g, (char) => {
    const index = persianNumbers.indexOf(char);
    return englishNumbers[index] ?? char; // Replace if Persian, otherwise keep the character
  });
};
export const convertToJalali = (date: string) =>
  moment(date, 'YYYY-MM-DD').format('jYYYY-jMM-jDD');

export const getAdultPrice = (value: FlightData) => {
  return Number(value?.adult_price) || 0;
};

export const normalizeAirlineName = (airlineName: string) => {
  if (!airlineName) return airlineName;
  
  const suffixesToRemove = [
    ' ایر',
    ' ایرلاین',
    ' ایرلاینز',
    ' airlines',
    ' airline',
    ' air',
    ' airways',
  ];
  
  let normalized = airlineName.trim();
  
  // Remove "هواپیمایی" prefix
  normalized = normalized.replace(/^هواپیمایی\s+/, '');

  // Normalize Persian/Arabic character variations
  normalized = normalized
    .replace(/ي/g, 'ی')  // Arabic Ya to Persian Ya
    .replace(/ك/g, 'ک')  // Arabic Kaf to Persian Kaf
    .replace(/[آأإٱ]/g, 'ا')  // All Alef variations to plain Alef
    .replace(/ة/g, 'ه')  // Ta Marbuta to Ha
    .replace(/ؤ/g, 'و')  // Waw with Hamza to Waw
    .replace(/ئ/g, 'ی'); // Ya with Hamza to Ya
  
  for (const suffix of suffixesToRemove) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
      break;
    }
  }
  
  return normalized;
};

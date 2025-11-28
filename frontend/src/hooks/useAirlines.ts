import { fetchAirlines } from '@/services/airlines';
import { useEffect, useState } from 'react';

// Normalize airline name to match flight data normalization
const normalizeAirlineName = (airlineName: string) => {
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

export const useAirlines = () => {
  const [data, setData] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchAirlines().then((response) => {
      // Normalize persian_name to match flight data
      const normalizedData = response?.data?.map((airline: any) => ({
        ...airline,
        persian_name: normalizeAirlineName(airline.persian_name),
        // Keep original for reference
        original_persian_name: airline.persian_name,
      })) || [];
      
      setData(normalizedData);
    });
  }, []);

  return {
    data,
  };
};

export const fetchCities = async () => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zambeel.ir';
    const response = await fetch(`${baseUrl}/airports?page=1&limit=100000`);
    const result = await response.json();
    return result;
  } catch (err) {
    return [];
  }
};

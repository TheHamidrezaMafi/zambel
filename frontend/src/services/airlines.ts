export const fetchAirlines = async () => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zambeel.ir';
    const url = `${baseUrl}/airlines?page=1&limit=100000`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('❌ Failed to fetch airlines:', err);
    return [];
  }
};

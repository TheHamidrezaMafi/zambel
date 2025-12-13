export const fetchCities = async () => {
  try {
    // Use backend hostname when running server-side in Docker, localhost for client-side
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer 
      ? 'http://backend:8080' 
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080');
    const response = await fetch(`${baseUrl}/airports?page=1&limit=100000`);
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching cities:', err);
    return [];
  }
};

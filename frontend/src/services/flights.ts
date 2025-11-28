export const fetchFlights = async (parameters: any) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.zambeel.ir';
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters),
    };
    const response = await fetch(`${baseUrl}/flights/search`, requestOptions);
    const result = await response.json();
    return result.flights;
  } catch (err: any) {
    console.error('Fetch error for', parameters.provider_name, err);
    return [];
  }
};

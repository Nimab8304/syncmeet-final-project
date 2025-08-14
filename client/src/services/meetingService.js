const API_URL = '/api/meetings';

// Fetch all meetings for the current user
export const getMeetings = async (token) => {
  const response = await fetch(API_URL, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Use token for protected routes
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch meetings');
  }
  const data = await response.json();
  return data;
};

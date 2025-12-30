// Utility functions for API calls with authentication

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-access-token');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  console.log('API Fetch:', url, 'Headers:', { ...headers, Authorization: (headers as any).Authorization ? 'Bearer ***' : 'None' });

  return fetch(url, {
    ...options,
    headers,
  });
}



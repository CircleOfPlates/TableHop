export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// JWT token management
const getToken = (): string | null => {
  return localStorage.getItem('jwt_token');
};

const setToken = (token: string): void => {
  localStorage.setItem('jwt_token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('jwt_token');
};

export const tokenManager = {
  getToken,
  setToken,
  removeToken,
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json', 
    ...(options.headers || {}) 
  };

  // Add JWT token to Authorization header if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    // Remove credentials: 'include' since we're using JWT tokens
  });
  
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}



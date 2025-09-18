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
  
  // Convert headers to a plain object
  const existingHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        existingHeaders[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      Object.assign(existingHeaders, options.headers);
    }
  }

  const headers: Record<string, string> = { 
    'Content-Type': 'application/json', 
    ...existingHeaders
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

// Types for matching system
export interface OptInRequest {
  partnerId?: number;
  matchAddress?: string;
  hostingAvailable: boolean;
}

export interface MatchingStatus {
  eventId: number;
  matchingStatus: 'open' | 'matching' | 'closed';
  matchingTriggeredAt: string | null;
  matchingCompletedAt: string | null;
  isOptedIn: boolean;
  userCircle: Circle | null;
  poolCount?: number;
}

export interface Circle {
  id: number;
  name: string;
  format: 'rotating' | 'hosted';
  members: CircleMember[];
}

export interface CircleMember {
  id: number;
  userId: number;
  role: 'host' | 'participant' | 'starter' | 'main' | 'dessert';
  user: {
    id: number;
    name: string | null;
    interests: string[] | null;
    personalityType: string | null;
    cookingExperience: string | null;
    dietaryRestrictions: string | null;
    socialPreferences: string[] | null;
  };
}

export interface MatchingPoolMember {
  id: number;
  userId: number;
  partnerId: number | null;
  matchAddress: string | null;
  hostingAvailable: boolean;
  dietaryRestrictions: string | null;
  interests: string[] | null;
  user: {
    id: number;
    name: string | null;
    interests: string[] | null;
    personalityType: string | null;
    cookingExperience: string | null;
    dietaryRestrictions: string | null;
    socialPreferences: string[] | null;
  };
  partner?: {
    id: number;
    name: string | null;
    interests: string[] | null;
    personalityType: string | null;
    cookingExperience: string | null;
    dietaryRestrictions: string | null;
    socialPreferences: string[] | null;
  };
}

// Matching API functions
export const matchingApi = {
  // Opt in to matching for an event
  optIn: (eventId: number, data: OptInRequest) =>
    api<{ message: string; optIn: any }>(`/api/matching/opt-in/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Opt out of matching for an event
  optOut: (eventId: number) =>
    api<{ message: string }>(`/api/matching/opt-out/${eventId}`, {
      method: 'POST',
    }),

  // Get matching status for an event
  getStatus: (eventId: number) =>
    api<MatchingStatus>(`/api/matching/status/${eventId}`),

  // Trigger matching for an event (admin only)
  triggerMatching: (eventId: number) =>
    api<{ message: string; circles: Circle[] }>(`/api/matching/trigger/${eventId}`, {
      method: 'POST',
    }),

  // Get matching results for an event
  getResults: (eventId: number) =>
    api<{ eventId: number; circles: Circle[] }>(`/api/matching/results/${eventId}`),

  // Get matching pool for an event (admin only)
  getPool: (eventId: number) =>
    api<{ eventId: number; pool: MatchingPoolMember[] }>(`/api/matching/pool/${eventId}`),
};

// Events API functions
export const eventsApi = {
  // Get user's matched events with circle details
  getMyMatchedEvents: () =>
    api<any[]>('/api/events/my-matched-events'),
  
  // Get user's past events with highlights
  getMyPastEvents: () =>
    api<any[]>('/api/events/my-past-events'),
  
  // Search for potential partners
  searchPartners: (query: string) =>
    api<Array<{ id: number; name: string; email: string }>>(`/api/events/partners/search?q=${encodeURIComponent(query)}`),
};

// Chat API functions
export const chatApi = {
  // Get chat messages for a circle
  getMessages: (circleId: number) =>
    api<any[]>(`/api/chat/circles/${circleId}/messages`),
  
  // Send a message to a circle
  sendMessage: (circleId: number, message: string) =>
    api<any>('/api/chat/circles/' + circleId + '/messages', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};



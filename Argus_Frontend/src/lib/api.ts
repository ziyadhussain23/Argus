// API Configuration and Helper Functions

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem('argus_api_url', url);
};

export const getApiBaseUrl = () => {
  return localStorage.getItem('argus_api_url') || 'http://localhost:8080/api/v1';
};

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

export interface Server {
  id: number;
  name: string;
  hostAddress: string;
  agentKey: string;
  operatingSystem: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  lastHeartbeat: string | null;
  createdAt: string;
  activeAlerts: number;
  description?: string;
}

export interface Metric {
  id: number;
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
  additionalInfo: string | null;
}

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  metricType: string;
  conditionOperator: 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN_OR_EQUAL' | 'EQUALS' | 'NOT_EQUALS';
  thresholdValue: number;
  durationSeconds?: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  isEnabled: boolean;
  cooldownMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Alert {
  id: number;
  serverId: number;
  serverName: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  metricValue: number;
  thresholdValue: number;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

// Auth helpers
export const getToken = (): string | null => {
  return localStorage.getItem('argus_token');
};

export const setToken = (token: string) => {
  localStorage.setItem('argus_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('argus_token');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Generic API request helper
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    return apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username: string, email: string, password: string) => {
    return apiRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  verifyEmail: async (token: string) => {
    return apiRequest<string>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    });
  },

  resendVerification: async (email: string) => {
    return apiRequest<string>(`/auth/resend-verification?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
  },

  getUserEmail: async (username: string) => {
    return apiRequest<string>(`/auth/get-email?username=${encodeURIComponent(username)}`);
  },

  forgotPassword: async (email: string) => {
    return apiRequest<string>('/auth/forgot-password?email=' + encodeURIComponent(email), {
      method: 'POST',
    });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest<string>('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token, newPassword }).toString(),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<string>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Servers API
export const serversApi = {
  getAll: () => apiRequest<Server[]>('/servers'),

  getById: (id: number) => apiRequest<Server>(`/servers/${id}`),

  create: (data: { name: string; hostAddress: string; operatingSystem: string; description?: string }) =>
    apiRequest<Server>('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: number) => apiRequest<null>(`/servers/${id}`, { method: 'DELETE' }),

  regenerateKey: (id: number) =>
    apiRequest<string>(`/servers/${id}/regenerate-key`, { method: 'POST' }),

  getMetrics: (id: number, params?: { type?: string; start?: string; end?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    const query = searchParams.toString();
    return apiRequest<Metric[]>(`/servers/${id}/metrics${query ? `?${query}` : ''}`);
  },

  getLatestMetric: (id: number, type: string) =>
    apiRequest<Metric>(`/servers/${id}/metrics/latest?type=${type}`),
};

// Alerts API
export const alertsApi = {
  getActive: () => apiRequest<Alert[]>('/alerts'),

  getByServer: (serverId: number) => apiRequest<Alert[]>(`/alerts/server/${serverId}`),

  acknowledge: (alertId: number) =>
    apiRequest<null>(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),

  resolve: (alertId: number) =>
    apiRequest<null>(`/alerts/${alertId}/resolve`, { method: 'POST' }),
};

// Alert Rules API
export const alertRulesApi = {
  getByServer: (serverId: number) =>
    apiRequest<AlertRule[]>(`/alerts/rules/server/${serverId}`),

  create: (data: {
    name: string;
    description?: string;
    serverId: number;
    metricType: string;
    conditionOperator: string;
    thresholdValue: number;
    durationSeconds?: number;
    severity: string;
    cooldownMinutes?: number;
  }) =>
    apiRequest<AlertRule>('/alerts/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggle: (ruleId: number, enabled: boolean) =>
    apiRequest<null>(`/alerts/rules/${ruleId}/toggle?enabled=${enabled}`, { method: 'PATCH' }),

  delete: (ruleId: number) =>
    apiRequest<null>(`/alerts/rules/${ruleId}`, { method: 'DELETE' }),
};

// API Configuration and Helper Functions

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem('argus_api_url', url);
};

export const getApiBaseUrl = () => {
  const url = localStorage.getItem('argus_api_url') || 'http://localhost:8080/api/v1';
  return url.replace(/\/+$/, '');
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

export interface NotificationPreferences {
  id: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  smsForCriticalOnly: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  smsAvailable: boolean;
}

export interface ScheduledReport {
  id: number;
  name: string;
  format: 'pdf' | 'csv' | 'excel';
  servers: number[];
  metrics: string[];
  timeframe: string;
  frequency: 'none' | 'auto';
  recipients: string;
  enabled: boolean;
  lastGeneratedAt?: string;
  nextRunAt?: string;
}

export interface SmsLogEntry {
  id: number;
  phoneNumber: string;
  status: string;
  messagePreview: string | null;
  segmentsCount: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
}

export interface SmsUsageStats {
  hourlyUsed: number;
  hourlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  hourlyRemaining: number;
  dailyRemaining: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Unable to connect to the server. Please check that the backend is running.');
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      localStorage.removeItem('argus_user');
      window.dispatchEvent(new Event('argus:unauthorized'));
    }
    throw new Error(data.message || `API request failed (HTTP ${response.status})`);
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

  deleteAccount: async () => {
    return apiRequest<string>('/auth/account', {
      method: 'DELETE',
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

  update: (id: number, data: { name?: string; hostAddress?: string; description?: string }) =>
    apiRequest<Server>(`/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

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

  getByStatus: (status: string) => apiRequest<Server[]>(`/servers/status/${encodeURIComponent(status)}`),
};

// Alerts API
export const alertsApi = {
  getActive: () => apiRequest<Alert[]>('/alerts'),

  getByServer: (serverId: number) => apiRequest<Alert[]>(`/alerts/server/${serverId}`),

  acknowledge: (alertId: number) =>
    apiRequest<null>(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),

  resolve: (alertId: number) =>
    apiRequest<null>(`/alerts/${alertId}/resolve`, { method: 'POST' }),

  getResolved: () => apiRequest<Alert[]>('/alerts/resolved'),

  getByStatus: (status: string) => apiRequest<Alert[]>(`/alerts/status/${encodeURIComponent(status)}`),
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

  getAllEnabled: () => apiRequest<AlertRule[]>('/alerts/rules/enabled'),

  update: (ruleId: number, data: {
    name: string;
    description?: string;
    metricType: string;
    conditionOperator: string;
    thresholdValue: number;
    durationSeconds?: number;
    severity: string;
    cooldownMinutes?: number;
  }) =>
    apiRequest<AlertRule>(`/alerts/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const notificationsApi = {
  getPreferences: () => apiRequest<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (data: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    smsForCriticalOnly?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: number;
    quietHoursEnd?: number;
  }) => apiRequest<NotificationPreferences>('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updatePhoneNumber: (phoneNumber: string) => apiRequest<string>('/notifications/phone', {
    method: 'PUT',
    body: JSON.stringify({ phoneNumber }),
  }),

  removePhoneNumber: () => apiRequest<string>('/notifications/phone', {
    method: 'DELETE',
  }),

  sendPhoneVerificationOtp: () => apiRequest<string>('/notifications/phone/verify/send', {
    method: 'POST',
  }),

  verifyPhoneOtp: (otp: string) => apiRequest<string>(`/notifications/phone/verify?otp=${encodeURIComponent(otp)}`, {
    method: 'POST',
  }),

  sendTestSms: () => apiRequest<string>('/notifications/sms/test', {
    method: 'POST',
  }),

  getSmsUsage: () => apiRequest<SmsUsageStats>('/notifications/sms/usage'),

  getSmsStatus: () => apiRequest<{ available: boolean; message: string }>('/notifications/sms/status'),

  getSmsLogs: () => apiRequest<SmsLogEntry[]>('/notifications/sms/logs'),

  getByAlert: (alertId: number) => apiRequest<unknown[]>(`/notifications/alert/${alertId}`),
};

export const profileApi = {
  get: () => apiRequest<UserProfile>('/auth/profile'),

  validate: () => apiRequest<string>('/auth/validate'),

  verifyToken: (token: string) =>
    apiRequest<string>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};

export const metricsApi = {
  getAverage: (serverId: number, type: string, minutes: number = 60) =>
    apiRequest<number>(`/metrics/server/${serverId}/average?type=${type}&minutes=${minutes}`),
};

export const reportsApi = {
  getAll: () => apiRequest<ScheduledReport[]>('/reports'),

  create: (data: {
    name: string;
    format: 'pdf' | 'csv' | 'excel';
    servers: number[];
    metrics: string[];
    timeframe: string;
    frequency: 'none' | 'auto';
    recipients: string;
    enabled: boolean;
  }) => apiRequest<ScheduledReport>('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: number, data: {
    name: string;
    format: 'pdf' | 'csv' | 'excel';
    servers: number[];
    metrics: string[];
    timeframe: string;
    frequency: 'none' | 'auto';
    recipients: string;
    enabled: boolean;
  }) => apiRequest<ScheduledReport>(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: number) => apiRequest<null>(`/reports/${id}`, { method: 'DELETE' }),
};

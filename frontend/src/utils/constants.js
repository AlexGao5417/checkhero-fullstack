export const USER_ROLES = {
  ADMIN: 1,
  AGENT: 2,
  USER: 3,
};

export const REPORT_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  DENIED: 'denied',
  PENDING: 'pending',
};

export const ACTION_TYPES = {
  APPROVE: 'approve',
  DECLINE: 'decline',
};

export const REPORT_TYPES = {
  ELECTRICITY_AND_SMOKE: 'electricityAndSmokeForm',
  GAS: 'gasForm',
  SMOKE: 'smokeForm',
};

export const REPORT_TYPE_IDS = {
  [REPORT_TYPES.ELECTRICITY_AND_SMOKE]: 1,
  [REPORT_TYPES.GAS]: 2,
  [REPORT_TYPES.SMOKE]: 3,
};

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  login: '/auth/login',
  users: '/users',
  agents: '/users?user_type_id=2',
  addresses: '/agent/addresses',
  reports: '/reports',
}; 
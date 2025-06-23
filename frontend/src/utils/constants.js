export const USER_ROLES = {
  ADMIN: 1,
  AGENT: 2,
  ELECTRICIAN: 3,
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
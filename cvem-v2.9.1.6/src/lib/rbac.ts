// ── RBAC: Role-Based Access Control ──────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'LOGISTICS' | 'HELPDESK' | 'ADMIN';

/** Map legacy role strings (from mockData/localStorage) → canonical UserRole */
export function toUserRole(role: string | undefined): UserRole {
  switch (role) {
    case 'merchant': return 'VENDOR';
    case 'delivery':  return 'LOGISTICS';
    case 'owner':     return 'ADMIN';
    case 'support':   return 'HELPDESK';
    default:          return 'CUSTOMER';
  }
}

/** Which roles are allowed on which path prefix */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/vendor':    ['VENDOR'],
  '/store-portal': ['VENDOR'],
  '/logistics': ['LOGISTICS'],
  '/admin-cp':  ['ADMIN'],
  '/helpdesk':  ['HELPDESK'],
};

/** The "home" route for each role after login */
export const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER:  '/',
  VENDOR:    '/store-portal/dashboard',
  LOGISTICS: '/logistics/dashboard',
  ADMIN:     '/admin-cp/dashboard',
  HELPDESK:  '/helpdesk/dashboard',
};

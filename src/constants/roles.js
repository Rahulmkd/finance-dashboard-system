export const ROLES = {
  VIEWER: "viewer",
  ANALYST: "analyst",
  ADMIN: "admin",
};

// Permission groups — use these in routes instead of repeating roles
export const CAN_VIEW = [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN];
export const CAN_ANALYZE = [ROLES.ANALYST, ROLES.ADMIN];
export const CAN_MANAGE = [ROLES.ADMIN];

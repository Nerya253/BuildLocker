/* src/utils/constants.js */

export const UserRoles = {
  SUPER: 'super',
  MANAGER: 'manager',
  USER: 'user',
};

export const AllUserRoles = [UserRoles.SUPER, UserRoles.MANAGER, UserRoles.USER];

export const LockerStatus = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
};

export const AllLockerStatuses = [LockerStatus.AVAILABLE, LockerStatus.IN_USE];

export const LockerEventTypes = {
  CREATED: 'created',
  UPDATED: 'updated',
  ACTIVATED: 'activated',
  DEACTIVATED: 'deactivated',
  OPENED: 'opened',
  RETURNED: 'returned',
};

export const AllLockerEventTypes = [
  LockerEventTypes.CREATED,
  LockerEventTypes.UPDATED,
  LockerEventTypes.ACTIVATED,
  LockerEventTypes.DEACTIVATED,
  LockerEventTypes.OPENED,
  LockerEventTypes.RETURNED,
];

export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'AUTHENTICATION_REQUIRED',
  FORBIDDEN: 'ACCESS_DENIED',
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'RESOURCE_CONFLICT',
  VALIDATION: 'VALIDATION_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
};

export const HttpStatus = {
  [ErrorCodes.BAD_REQUEST]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.VALIDATION]: 422,
  [ErrorCodes.INTERNAL]: 500,
};

export const Limits = {
  TOKEN_EXPIRY_HOURS: 3,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PAGE_SIZE: 500,
  DEFAULT_PAGE_SIZE: 100,
};

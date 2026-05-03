/* src/utils/helpers.js */
import jwt from 'jsonwebtoken';

/* ============================================================
   Security
   ============================================================ */

export const saltRounds = 10;

export function generateToken({ user_id, full_name, role }) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    {
      user_id,
      full_name,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '3h',
    },
  );
}

export function safeUser(user) {
  if (!user) {
    return null;
  }

  const { password_hash, password, ...safe } = user;

  return safe;
}

/* ============================================================
   Assertions
   ============================================================ */

export function assert(condition, message = 'Bad Request', status = 400, code = null) {
  if (!condition) {
    const error = new Error(message);
    error.status = status;

    if (code) {
      error.code = code;
    }

    throw error;
  }
}

export function assertActor(actorUser) {
  assert(actorUser && actorUser.user_id, 'Unauthorized', 401);
}

/* ============================================================
   Roles
   ============================================================ */

export function isSuper(user) {
  return user?.role === 'super';
}

export function isManager(user) {
  return user?.role === 'manager';
}

export function isUser(user) {
  return user?.role === 'user';
}

/* ============================================================
   ID Validations
   ============================================================ */

export function assertValidId(raw, message = 'Invalid user id') {
  const value = String(raw || '').trim();

  assert(/^\d{9}$/.test(value), message, 400);

  return value;
}

export function assertValidBuildingId(raw, message = 'Invalid building id') {
  const value = Number(raw);

  assert(Number.isInteger(value) && value > 0, message, 400);

  return value;
}

export function assertValidLockerId(raw, message = 'Invalid locker id') {
  const value = Number(raw);

  assert(Number.isInteger(value) && value > 0, message, 400);

  return value;
}

/* ============================================================
   Data Validation
   ============================================================ */

export function isEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function normalizeIsraeliPhone(phone) {
  if (!phone) {
    return null;
  }

  let value = String(phone).replace(/\D/g, '');

  if (value.startsWith('972')) {
    value = `0${value.substring(3)}`;
  }

  if (value.length === 9 && value.startsWith('5')) {
    value = `0${value}`;
  }

  if (value.length === 10 && value.startsWith('05')) {
    return value;
  }

  return null;
}

export function isValidPhone(phone) {
  return normalizeIsraeliPhone(phone) !== null;
}

export function isStrongPassword(password) {
  const value = String(password || '');

  if (value.length < 8) {
    return false;
  }

  if (!/[A-Z]/.test(value)) {
    return false;
  }

  if (!/[a-z]/.test(value)) {
    return false;
  }

  if (!/[0-9]/.test(value)) {
    return false;
  }

  return true;
}

/* ============================================================
   Generators
   ============================================================ */

export function generateRandomPassword(length = 12) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const allChars = upper + lower + numbers + special;

  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  for (let i = 3; i < length; i += 1) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

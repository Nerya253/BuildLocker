/* src/modules/auth/authService.js */
import bcrypt from 'bcrypt';

import { assert, assertActor, generateToken, isEmail, safeUser } from '../../utils/helpers.js';

import { getUserByEmail, getUserById, updateLastLoginAt } from './authRepo.js';

/* ============================================================
   Auth Services
   ============================================================ */

export async function loginService(payload) {
  const email = String(payload?.email || '')
    .toLowerCase()
    .trim();

  const password = String(payload?.password || '');

  assert(isEmail(email), 'Invalid email format', 400);
  assert(password, 'Password is required', 400);

  const user = await getUserByEmail(email);

  const isValidPassword = user ? await bcrypt.compare(password, user.password_hash) : false;

  assert(isValidPassword, 'Invalid email or password', 401);
  assert(user.is_active === 1, 'Account is inactive', 403);

  updateLastLoginAt(user.user_id).catch(() => {});

  const token = generateToken({
    user_id: user.user_id,
    full_name: user.full_name,
    role: user.role,
  });

  return {
    token,
    user: safeUser(user),
  };
}

export async function getSessionService(actorUser) {
  assertActor(actorUser);

  const user = await getUserById(actorUser.user_id);

  assert(user, 'User not found', 404);
  assert(user.is_active === 1, 'Account is inactive', 403);

  return {
    ok: true,
    user: safeUser(user),
  };
}

/*
Future option:
Forgot password service.
*/

/* src/middleware/auth.js */
import jwt from 'jsonwebtoken';

import { getUserById } from '../modules/auth/authRepo.js';

function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie('Session', {
    path: '/',
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });
}

export async function requireAuthCookie(req, res, next) {
  try {
    const token = req.cookies?.Session;

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized',
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await getUserById(payload.user_id);

    if (!user || user.is_active !== 1) {
      clearSessionCookie(res);

      return res.status(401).json({
        ok: false,
        message: 'Unauthorized',
      });
    }

    req.user = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
    };

    next();
  } catch (error) {
    clearSessionCookie(res);

    return res.status(401).json({
      ok: false,
      message: 'Unauthorized',
    });
  }
}

export function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: 'Forbidden',
      });
    }

    next();
  };
}

/* src/modules/auth/authRouter.js */
import express from 'express';

import { requireAuthCookie } from '../../middleware/auth.js';
import { Schemas, validateRequest } from '../../middleware/validation.js';

import { getSessionService, loginService } from './authService.js';

const AuthRouter = express.Router();

/* ============================================================
   Auth Routes
   ============================================================ */

// POST /api/auth/login
AuthRouter.post('/login', validateRequest(Schemas.login), async (req, res, next) => {
  try {
    const result = await loginService(req.body, req);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('Session', result.token, {
      httpOnly: true,
      sameSite: isProd ? 'strict' : 'lax',
      secure: isProd,
      maxAge: 3 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      ok: true,
      user: result.user,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/session
AuthRouter.get('/session', requireAuthCookie, async (req, res, next) => {
  try {
    return res.json(await getSessionService(req.user));
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/logout
AuthRouter.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie('Session', {
    path: '/',
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });

  return res.json({
    ok: true,
    message: 'Logged out successfully',
  });
});

/*
Future option:
Forgot password flow.

POST /api/auth/forgot-password

Enable later only when:
- Schemas.forgotPassword exists
- forgotPasswordService exists
- emailService is ready
*/

export default AuthRouter;

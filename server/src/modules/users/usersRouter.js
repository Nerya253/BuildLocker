/* src/modules/users/usersRouter.js */
import express from 'express';

import { requireAuthCookie, requireRole } from '../../middleware/auth.js';
import { Schemas, validateRequest } from '../../middleware/validation.js';

import {
  changeMyPasswordService,
  createUserService,
  getMeService,
  listUsersService,
  toggleUserStatusService,
  transferUserBuildingService,
  updateMeService,
} from './usersService.js';

const UserRouter = express.Router();

/* ============================================================
   Personal Routes
   ============================================================ */

UserRouter.get('/me', requireAuthCookie, async (req, res, next) => {
  try {
    return res.json(await getMeService(req.user));
  } catch (e) {
    next(e);
  }
});

UserRouter.put('/me', requireAuthCookie, validateRequest(Schemas.updateMe), async (req, res, next) => {
  try {
    return res.json(await updateMeService(req.body, req.user));
  } catch (e) {
    next(e);
  }
});

UserRouter.put(
  '/me/password',
  requireAuthCookie,
  validateRequest(Schemas.changePassword),
  async (req, res, next) => {
    try {
      return res.json(await changeMyPasswordService(req.body, req.user));
    } catch (e) {
      next(e);
    }
  },
);

/* ============================================================
   Management Routes
   ============================================================ */

UserRouter.get('/', requireAuthCookie, requireRole(['super', 'manager']), async (req, res, next) => {
  try {
    return res.json(await listUsersService(req.query, req.user));
  } catch (e) {
    next(e);
  }
});

UserRouter.post(
  '/',
  requireAuthCookie,
  requireRole(['super', 'manager']),
  validateRequest(Schemas.createUser),
  async (req, res, next) => {
    try {
      return res.status(201).json(await createUserService(req.body, req.user));
    } catch (e) {
      next(e);
    }
  },
);

UserRouter.put(
  '/:user_id/status',
  requireAuthCookie,
  requireRole(['super', 'manager']),
  validateRequest(Schemas.updateUserStatus),
  async (req, res, next) => {
    try {
      return res.json(await toggleUserStatusService(req.params.user_id, req.body.is_active, req.user));
    } catch (e) {
      next(e);
    }
  },
);

UserRouter.put(
  '/:user_id/building',
  requireAuthCookie,
  requireRole('super'),
  validateRequest(Schemas.transferUserBuilding),
  async (req, res, next) => {
    try {
      return res.json(
        await transferUserBuildingService(
          req.params.user_id,
          req.body.building_id,
          req.user,
        ),
      );
    } catch (e) {
      next(e);
    }
  },
);

export default UserRouter;

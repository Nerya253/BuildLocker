/* src/modules/lockers/lockersRouter.js */
import express from 'express';

import { requireAuthCookie, requireRole } from '../../middleware/auth.js';
import { Schemas, validateRequest } from '../../middleware/validation.js';

import {
  createLockerService,
  getLockerByIdService,
  listLockerEventsService,
  listLockersService,
  openLockerService,
  returnLockerService,
  toggleLockerStatusService,
  updateLockerService,
} from './lockersService.js';

const LockersRouter = express.Router();

/* ============================================================
   Lockers Routes
   ============================================================ */

LockersRouter.use(requireAuthCookie);

/* ============================================================
   Events
   ============================================================ */

// GET /api/lockers/events
LockersRouter.get('/events', requireRole(['super', 'manager']), async (req, res, next) => {
  try {
    return res.json(await listLockerEventsService(req.query, req.user));
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   Core Actions
   ============================================================ */

// POST /api/lockers/:locker_id/open
LockersRouter.post('/:locker_id/open', async (req, res, next) => {
  try {
    return res.json(await openLockerService(req.params.locker_id, req.user, req));
  } catch (e) {
    next(e);
  }
});

// POST /api/lockers/:locker_id/return
LockersRouter.post('/:locker_id/return', async (req, res, next) => {
  try {
    return res.json(await returnLockerService(req.params.locker_id, req.user, req));
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   Read
   ============================================================ */

// GET /api/lockers
LockersRouter.get('/', async (req, res, next) => {
  try {
    return res.json(await listLockersService(req.query, req.user));
  } catch (e) {
    next(e);
  }
});

// GET /api/lockers/:locker_id
LockersRouter.get('/:locker_id', async (req, res, next) => {
  try {
    return res.json(await getLockerByIdService(req.params.locker_id, req.user));
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   Management
   ============================================================ */

// POST /api/lockers
LockersRouter.post('/', requireRole(['super', 'manager']), validateRequest(Schemas.createLocker), async (req, res, next) => {
  try {
    return res.status(201).json(await createLockerService(req.body, req.user, req));
  } catch (e) {
    next(e);
  }
});

// PUT /api/lockers/:locker_id
LockersRouter.put('/:locker_id', requireRole(['super', 'manager']), validateRequest(Schemas.updateLocker), async (req, res, next) => {
  try {
    return res.json(await updateLockerService(req.params.locker_id, req.body, req.user, req));
  } catch (e) {
    next(e);
  }
});

// PUT /api/lockers/:locker_id/status
LockersRouter.put('/:locker_id/status', requireRole(['super', 'manager']), async (req, res, next) => {
  try {
    return res.json(await toggleLockerStatusService(req.params.locker_id, req.body.is_active, req.user, req));
  } catch (e) {
    next(e);
  }
});

export default LockersRouter;

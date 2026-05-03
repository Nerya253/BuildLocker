/* src/modules/buildings/buildingsRouter.js */
import express from 'express';

import { requireAuthCookie, requireRole } from '../../middleware/auth.js';
import { Schemas, validateRequest } from '../../middleware/validation.js';

import {
  createBuildingService,
  getBuildingByIdService,
  listBuildingsService,
  setBuildingManagerService,
  toggleBuildingStatusService,
  updateBuildingService,
} from './buildingsService.js';

const BuildingsRouter = express.Router();

/* ============================================================
   Buildings Routes
   ============================================================ */

BuildingsRouter.use(requireAuthCookie);

// GET /api/buildings
BuildingsRouter.get('/', requireRole(['super', 'manager']), async (req, res, next) => {
  try {
    return res.json(await listBuildingsService(req.query, req.user));
  } catch (e) {
    next(e);
  }
});

// GET /api/buildings/:building_id
BuildingsRouter.get('/:building_id', requireRole(['super', 'manager']), async (req, res, next) => {
  try {
    return res.json(await getBuildingByIdService(req.params.building_id, req.user));
  } catch (e) {
    next(e);
  }
});

// POST /api/buildings
BuildingsRouter.post('/', requireRole('super'), validateRequest(Schemas.createBuilding), async (req, res, next) => {
  try {
    return res.status(201).json(await createBuildingService(req.body, req.user, req));
  } catch (e) {
    next(e);
  }
});

// PUT /api/buildings/:building_id
BuildingsRouter.put('/:building_id', requireRole('super'), validateRequest(Schemas.updateBuilding), async (req, res, next) => {
  try {
    return res.json(await updateBuildingService(req.params.building_id, req.body, req.user, req));
  } catch (e) {
    next(e);
  }
});

// PUT /api/buildings/:building_id/status
BuildingsRouter.put('/:building_id/status', requireRole('super'), async (req, res, next) => {
  try {
    return res.json(await toggleBuildingStatusService(req.params.building_id, req.body.is_active, req.user, req));
  } catch (e) {
    next(e);
  }
});

// PUT /api/buildings/:building_id/manager
BuildingsRouter.put('/:building_id/manager', requireRole('super'), async (req, res, next) => {
  try {
    return res.json(await setBuildingManagerService(req.params.building_id, req.body.manager_id, req.user, req));
  } catch (e) {
    next(e);
  }
});

export default BuildingsRouter;

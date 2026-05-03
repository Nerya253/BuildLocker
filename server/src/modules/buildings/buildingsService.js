/* src/modules/buildings/buildingsService.js */
import { withTransaction } from '../../db/db_connection.js';

import { assert, assertActor, assertValidId } from '../../utils/helpers.js';

import { getUserById } from '../users/usersRepo.js';

import { countBuildings, getBuildingById, insertBuilding, listBuildings, updateBuildingFields } from './buildingsRepo.js';

/* ============================================================
   Internal Helpers
   ============================================================ */

function assertCanViewBuildings(actorUser) {
  assertActor(actorUser);
  assert(['super', 'manager'].includes(actorUser.role), 'Forbidden', 403);
}

function assertCanManageBuildings(actorUser) {
  assertActor(actorUser);
  assert(actorUser.role === 'super', 'Forbidden: Super only', 403);
}

function assertValidBuildingId(value) {
  const buildingId = Number(value);

  assert(Number.isInteger(buildingId) && buildingId > 0, 'Invalid building id', 400);

  return buildingId;
}

async function validateManager(manager_id) {
  if (!manager_id) {
    return null;
  }

  const managerId = assertValidId(manager_id);

  const manager = await getUserById(managerId);

  assert(manager, 'Manager not found', 404);
  assert(manager.role === 'manager', 'Selected user is not a manager', 400);
  assert(manager.is_active === 1, 'Manager account is inactive', 400);

  return managerId;
}

function assertCanAccessBuilding(actorUser, building) {
  if (actorUser.role === 'super') {
    return;
  }

  if (actorUser.role === 'manager') {
    assert(String(building.manager_id) === String(actorUser.user_id), 'Forbidden', 403);

    return;
  }

  assert(false, 'Forbidden', 403);
}

/* ============================================================
   Buildings Actions
   ============================================================ */

export async function listBuildingsService(filters = {}, actorUser) {
  assertCanViewBuildings(actorUser);

  const finalFilters = {
    ...filters,
  };

  if (actorUser.role === 'manager') {
    finalFilters.manager_id = actorUser.user_id;
  }

  const [buildings, total] = await Promise.all([listBuildings(finalFilters), countBuildings(finalFilters)]);

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  return {
    ok: true,
    buildings,
    meta: {
      total,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getBuildingByIdService(building_id_raw, actorUser) {
  assertCanViewBuildings(actorUser);

  const building_id = assertValidBuildingId(building_id_raw);

  const building = await getBuildingById(building_id);
  assert(building, 'Building not found', 404);

  assertCanAccessBuilding(actorUser, building);

  return {
    ok: true,
    building,
  };
}

export async function createBuildingService(payload, actorUser) {
  assertCanManageBuildings(actorUser);

  const name = String(payload.name || '').trim();
  const city = String(payload.city || '').trim();
  const address = String(payload.address || '').trim();

  const manager_id = payload.manager_id ? await validateManager(payload.manager_id) : null;

  assert(name.length >= 2, 'Building name is required', 400);
  assert(city.length >= 2, 'City is required', 400);
  assert(address.length >= 2, 'Address is required', 400);

  return await withTransaction(async (conn) => {
    const building_id = await insertBuilding(
      {
        name,
        city,
        address,
        manager_id,
        created_by: actorUser.user_id,
        is_active: 1,
      },
      conn,
    );

    return {
      ok: true,
      building_id,
      message: 'Building created successfully',
    };
  });
}

export async function updateBuildingService(building_id_raw, payload, actorUser) {
  assertCanManageBuildings(actorUser);

  const building_id = assertValidBuildingId(building_id_raw);

  const building = await getBuildingById(building_id);
  assert(building, 'Building not found', 404);

  const patch = {};

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    assert(name.length >= 2, 'Building name is too short', 400);
    patch.name = name;
  }

  if (payload.city !== undefined) {
    const city = String(payload.city || '').trim();
    assert(city.length >= 2, 'City is too short', 400);
    patch.city = city;
  }

  if (payload.address !== undefined) {
    const address = String(payload.address || '').trim();
    assert(address.length >= 2, 'Address is too short', 400);
    patch.address = address;
  }

  if (payload.manager_id !== undefined) {
    patch.manager_id = payload.manager_id ? await validateManager(payload.manager_id) : null;
  }

  assert(Object.keys(patch).length > 0, 'No fields to update', 400);

  return await withTransaction(async (conn) => {
    await updateBuildingFields(building_id, patch, conn);

    return {
      ok: true,
      message: 'Building updated successfully',
    };
  });
}

export async function toggleBuildingStatusService(building_id_raw, isActive, actorUser) {
  assertCanManageBuildings(actorUser);

  const building_id = assertValidBuildingId(building_id_raw);

  assert(typeof isActive === 'boolean', 'is_active must be boolean', 400);

  const building = await getBuildingById(building_id);
  assert(building, 'Building not found', 404);

  return await withTransaction(async (conn) => {
    await updateBuildingFields(building_id, { is_active: isActive ? 1 : 0 }, conn);

    return {
      ok: true,
      message: isActive ? 'Building activated' : 'Building deactivated',
    };
  });
}

export async function setBuildingManagerService(building_id_raw, manager_id_raw, actorUser) {
  assertCanManageBuildings(actorUser);

  const building_id = assertValidBuildingId(building_id_raw);
  const manager_id = await validateManager(manager_id_raw);

  const building = await getBuildingById(building_id);
  assert(building, 'Building not found', 404);

  return await withTransaction(async (conn) => {
    await updateBuildingFields(building_id, { manager_id }, conn);

    return {
      ok: true,
      message: 'Building manager updated successfully',
    };
  });
}

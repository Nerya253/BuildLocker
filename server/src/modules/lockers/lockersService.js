/* src/modules/lockers/lockersService.js */
import { withTransaction } from '../../db/db_connection.js';

import { assert, assertActor } from '../../utils/helpers.js';

import { getBuildingById } from '../buildings/buildingsRepo.js';

import { countLockerEvents, insertLockerEvent, listLockerEvents } from './lockerEventsRepo.js';

import {
  countLockers,
  existsLockerNumberInBuilding,
  getLockerById,
  getLockerForUpdate,
  insertLocker,
  listLockers,
  updateLockerFields,
} from './lockersRepo.js';

/* ============================================================
   Internal Helpers
   ============================================================ */

function assertValidLockerId(value) {
  const lockerId = Number(value);

  assert(Number.isInteger(lockerId) && lockerId > 0, 'Invalid locker id', 400);

  return lockerId;
}

function assertValidBuildingId(value) {
  const buildingId = Number(value);

  assert(Number.isInteger(buildingId) && buildingId > 0, 'Invalid building id', 400);

  return buildingId;
}

function assertValidLockerNumber(value) {
  const lockerNumber = Number(value);

  assert(Number.isInteger(lockerNumber) && lockerNumber > 0, 'Invalid locker number', 400);

  return lockerNumber;
}

function assertCanManageLockers(actorUser) {
  assertActor(actorUser);
  assert(['super', 'manager'].includes(actorUser.role), 'Forbidden', 403);
}

function assertCanViewLocker(actorUser) {
  assertActor(actorUser);
  assert(['super', 'manager', 'user'].includes(actorUser.role), 'Forbidden', 403);
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

function assertCanManageSpecificLocker(actorUser, locker) {
  if (actorUser.role === 'super') {
    return;
  }

  if (actorUser.role === 'manager') {
    assert(String(locker.manager_id) === String(actorUser.user_id), 'Forbidden', 403);

    return;
  }

  assert(false, 'Forbidden', 403);
}

function getScopedLockerFilters(filters, actorUser) {
  const finalFilters = {
    ...filters,
  };

  if (actorUser.role === 'manager') {
    finalFilters.manager_id = actorUser.user_id;
  }

  return finalFilters;
}

/* ============================================================
   Read Actions
   ============================================================ */

export async function listLockersService(filters = {}, actorUser) {
  assertCanViewLocker(actorUser);

  const finalFilters = getScopedLockerFilters(filters, actorUser);

  const [lockers, total] = await Promise.all([listLockers(finalFilters), countLockers(finalFilters)]);

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  return {
    ok: true,
    lockers,
    meta: {
      total,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getLockerByIdService(locker_id_raw, actorUser) {
  assertCanViewLocker(actorUser);

  const locker_id = assertValidLockerId(locker_id_raw);

  const locker = await getLockerById(locker_id);
  assert(locker, 'Locker not found', 404);

  if (actorUser.role === 'manager') {
    assert(String(locker.manager_id) === String(actorUser.user_id), 'Forbidden', 403);
  }

  return {
    ok: true,
    locker,
  };
}

/* ============================================================
   Management Actions
   ============================================================ */

export async function createLockerService(payload, actorUser) {
  assertCanManageLockers(actorUser);

  const building_id = assertValidBuildingId(payload.building_id);
  const locker_number = assertValidLockerNumber(payload.locker_number);
  const notes = payload.notes !== undefined ? String(payload.notes || '').trim() : null;

  const building = await getBuildingById(building_id);
  assert(building, 'Building not found', 404);
  assert(building.is_active === 1, 'Building is inactive', 400);

  assertCanAccessBuilding(actorUser, building);

  return await withTransaction(async (conn) => {
    const exists = await existsLockerNumberInBuilding(building_id, locker_number);
    assert(!exists, 'Locker number already exists in this building', 409);

    const locker_id = await insertLocker(
      {
        building_id,
        locker_number,
        notes,
        created_by: actorUser.user_id,
        is_active: 1,
      },
      conn,
    );

    await insertLockerEvent(
      {
        locker_id,
        user_id: actorUser.user_id,
        event_type: 'created',
        details: {
          building_id,
          locker_number,
        },
      },
      conn,
    );

    return {
      ok: true,
      locker_id,
      message: 'Locker created successfully',
    };
  });
}

export async function updateLockerService(locker_id_raw, payload, actorUser) {
  assertCanManageLockers(actorUser);

  const locker_id = assertValidLockerId(locker_id_raw);

  const locker = await getLockerById(locker_id);
  assert(locker, 'Locker not found', 404);

  assertCanManageSpecificLocker(actorUser, locker);

  const patch = {};

  if (payload.locker_number !== undefined) {
    patch.locker_number = assertValidLockerNumber(payload.locker_number);
  }

  if (payload.notes !== undefined) {
    patch.notes = String(payload.notes || '').trim();
  }

  assert(Object.keys(patch).length > 0, 'No fields to update', 400);

  return await withTransaction(async (conn) => {
    if (patch.locker_number !== undefined && Number(patch.locker_number) !== Number(locker.locker_number)) {
      const exists = await existsLockerNumberInBuilding(locker.building_id, patch.locker_number);
      assert(!exists, 'Locker number already exists in this building', 409);
    }

    await updateLockerFields(locker_id, patch, conn);

    await insertLockerEvent(
      {
        locker_id,
        user_id: actorUser.user_id,
        event_type: 'updated',
        details: patch,
      },
      conn,
    );

    return {
      ok: true,
      message: 'Locker updated successfully',
    };
  });
}

export async function toggleLockerStatusService(locker_id_raw, isActive, actorUser) {
  assertCanManageLockers(actorUser);

  const locker_id = assertValidLockerId(locker_id_raw);

  assert(typeof isActive === 'boolean', 'is_active must be boolean', 400);

  const locker = await getLockerById(locker_id);
  assert(locker, 'Locker not found', 404);

  assertCanManageSpecificLocker(actorUser, locker);

  return await withTransaction(async (conn) => {
    await updateLockerFields(locker_id, { is_active: isActive ? 1 : 0 }, conn);

    await insertLockerEvent(
      {
        locker_id,
        user_id: actorUser.user_id,
        event_type: isActive ? 'activated' : 'deactivated',
        details: {
          is_active: isActive ? 1 : 0,
        },
      },
      conn,
    );

    return {
      ok: true,
      message: isActive ? 'Locker activated' : 'Locker deactivated',
    };
  });
}

/* ============================================================
   Core Locker Actions
   ============================================================ */

export async function openLockerService(locker_id_raw, actorUser) {
  assertCanViewLocker(actorUser);

  const locker_id = assertValidLockerId(locker_id_raw);

  return await withTransaction(async (conn) => {
    const locker = await getLockerForUpdate(locker_id, conn);
    assert(locker, 'Locker not found', 404);
    assert(locker.is_active === 1, 'Locker is inactive', 400);
    assert(locker.status === 'available', 'Locker is already in use', 409);

    await updateLockerFields(
      locker_id,
      {
        status: 'in_use',
        last_opened_at: new Date(),
        last_opened_by: actorUser.user_id,
      },
      conn,
    );

    await insertLockerEvent(
      {
        locker_id,
        user_id: actorUser.user_id,
        event_type: 'opened',
        details: {
          previous_status: locker.status,
          new_status: 'in_use',
        },
      },
      conn,
    );

    return {
      ok: true,
      message: 'Locker opened successfully',
    };
  });
}

export async function returnLockerService(locker_id_raw, actorUser) {
  assertCanViewLocker(actorUser);

  const locker_id = assertValidLockerId(locker_id_raw);

  return await withTransaction(async (conn) => {
    const locker = await getLockerForUpdate(locker_id, conn);
    assert(locker, 'Locker not found', 404);
    assert(locker.is_active === 1, 'Locker is inactive', 400);
    assert(locker.status === 'in_use', 'Locker is not in use', 409);

    await updateLockerFields(
      locker_id,
      {
        status: 'available',
      },
      conn,
    );

    await insertLockerEvent(
      {
        locker_id,
        user_id: actorUser.user_id,
        event_type: 'returned',
        details: {
          previous_status: locker.status,
          new_status: 'available',
        },
      },
      conn,
    );

    return {
      ok: true,
      message: 'Locker returned successfully',
    };
  });
}

/* ============================================================
   Events
   ============================================================ */

export async function listLockerEventsService(filters = {}, actorUser) {
  assertCanManageLockers(actorUser);

  const finalFilters = {
    ...filters,
  };

  if (actorUser.role === 'manager') {
    finalFilters.manager_id = actorUser.user_id;
  }

  const [events, total] = await Promise.all([listLockerEvents(finalFilters), countLockerEvents(finalFilters)]);

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  return {
    ok: true,
    events,
    meta: {
      total,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

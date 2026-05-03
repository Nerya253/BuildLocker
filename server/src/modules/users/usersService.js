/* src/modules/users/usersService.js */
import bcrypt from 'bcrypt';
import { withTransaction } from '../../db/db_connection.js';

import { ErrorCodes } from '../../utils/constants.js';
import {
  assert,
  assertActor,
  assertValidBuildingId,
  assertValidId,
  isEmail,
  isStrongPassword,
  isValidPhone,
  normalizeIsraeliPhone,
  safeUser,
  saltRounds,
} from '../../utils/helpers.js';

import {
  getBuildingById,
  listBuildings,
} from '../buildings/buildingsRepo.js';

import * as Repo from './usersRepo.js';

/* ============================================================
   Personal Actions
   ============================================================ */

export async function getMeService(actorUser) {
  assertActor(actorUser);

  const user = await Repo.getUserById(actorUser.user_id);
  assert(user, 'User not found', 404);

  return {
    ok: true,
    user: safeUser(user),
  };
}

export async function updateMeService(payload, actorUser) {
  assertActor(actorUser);

  return await withTransaction(async (conn) => {
    const patch = {};

    if (payload.full_name !== undefined) {
      const fullName = String(payload.full_name || '').trim();

      assert(fullName.length >= 2, 'Full name is too short', 400);

      patch.full_name = fullName;
    }

    if (payload.phone !== undefined) {
      const normalizedPhone = normalizeIsraeliPhone(payload.phone);

      assert(isValidPhone(normalizedPhone), 'Invalid phone format', 400);

      const currentUser = await Repo.getUserById(actorUser.user_id);
      assert(currentUser, 'User not found', 404);

      if (normalizedPhone !== currentUser.phone) {
        const existingPhone = await Repo.existsByPhone(normalizedPhone);
        assert(!existingPhone, 'Phone number already in use', 409, ErrorCodes.CONFLICT);
      }

      patch.phone = normalizedPhone;
    }

    if (Object.keys(patch).length > 0) {
      await Repo.updateUserFields(actorUser.user_id, patch, conn);
    }

    const updatedUser = await Repo.getUserById(actorUser.user_id);

    return {
      ok: true,
      user: safeUser(updatedUser),
    };
  });
}

export async function changeMyPasswordService(payload, actorUser) {
  assertActor(actorUser);

  const currentPassword = String(payload.current_password || '');
  const newPassword = String(payload.new_password || '');

  assert(currentPassword, 'Current password is required', 400);
  assert(newPassword, 'New password is required', 400);
  assert(isStrongPassword(newPassword), 'New password is too weak', 400);
  assert(currentPassword !== newPassword, 'New password must be different from current password', 400);

  return await withTransaction(async (conn) => {
    const user = await Repo.getUserById(actorUser.user_id);
    assert(user, 'User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    assert(isMatch, 'Current password is incorrect', 401, ErrorCodes.UNAUTHORIZED);

    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await Repo.updateUserPassword(actorUser.user_id, newHash, conn);

    return {
      ok: true,
      message: 'Password updated successfully',
    };
  });
}

/* ============================================================
   Management Helpers
   ============================================================ */

function assertCanManageUsers(actorUser) {
  assertActor(actorUser);
  assert(['super', 'manager'].includes(actorUser.role), 'Forbidden', 403);
}

function getAllowedRolesForList(actorUser) {
  if (actorUser.role === 'super') {
    return ['manager', 'user'];
  }

  if (actorUser.role === 'manager') {
    return ['user'];
  }

  return [];
}

function getAllowedRoleToCreate(payloadRole, actorUser) {
  if (actorUser.role === 'super') {
    const role = payloadRole || 'user';

    assert(['manager', 'user'].includes(role), 'Invalid role', 400);

    return role;
  }

  if (actorUser.role === 'manager') {
    return 'user';
  }

  assert(false, 'Forbidden', 403);
}

async function assertManagerCanAccessBuilding(actorUser, building_id) {
  const building = await getBuildingById(building_id);

  assert(building, 'Building not found', 404);
  assert(building.is_active === 1, 'Building is inactive', 400);
  assert(String(building.manager_id) === String(actorUser.user_id), 'Forbidden', 403);

  return building;
}

async function resolveBuildingIdForNewUser(payload, actorUser) {
  if (actorUser.role === 'super') {
    if (payload.building_id === undefined || payload.building_id === null || payload.building_id === '') {
      return null;
    }

    const building_id = assertValidBuildingId(payload.building_id);
    const building = await getBuildingById(building_id);

    assert(building, 'Building not found', 404);
    assert(building.is_active === 1, 'Building is inactive', 400);

    return building_id;
  }

  if (actorUser.role === 'manager') {
    if (payload.building_id !== undefined && payload.building_id !== null && payload.building_id !== '') {
      const building_id = assertValidBuildingId(payload.building_id);
      await assertManagerCanAccessBuilding(actorUser, building_id);
      return building_id;
    }

    const managedBuildings = await listBuildings({
      manager_id: actorUser.user_id,
      is_active: 1,
      limit: 2,
      offset: 0,
    });

    assert(managedBuildings.length > 0, 'Manager is not assigned to an active building', 403);
    assert(managedBuildings.length === 1, 'building_id is required because manager has more than one building', 400);

    return managedBuildings[0].building_id;
  }

  assert(false, 'Forbidden', 403);
}

async function assertCanChangeTargetStatus(actorUser, targetUser) {
  if (actorUser.role === 'super') {
    assert(targetUser.role !== 'super', 'Cannot change super account status', 403);
    return;
  }

  if (actorUser.role === 'manager') {
    assert(targetUser.role === 'user', 'Manager can only change regular users', 403);
    assert(targetUser.building_id, 'Target user is not assigned to a building', 403);

    await assertManagerCanAccessBuilding(actorUser, targetUser.building_id);
    return;
  }

  assert(false, 'Forbidden', 403);
}

/* ============================================================
   Management Actions
   ============================================================ */

export async function listUsersService(filters = {}, actorUser) {
  assertCanManageUsers(actorUser);

  const finalFilters = {
    ...filters,
    roles: getAllowedRolesForList(actorUser),
  };

  if (actorUser.role === 'manager') {
    finalFilters.manager_id = actorUser.user_id;
  }

  const [users, total] = await Promise.all([
    Repo.listUsers(finalFilters),
    Repo.countUsers(finalFilters),
  ]);

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  return {
    ok: true,
    users: users.map(safeUser),
    meta: {
      total,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function createUserService(payload, actorUser) {
  assertCanManageUsers(actorUser);

  const user_id = assertValidId(payload.user_id);

  const full_name = String(payload.full_name || '').trim();

  const email = String(payload.email || '')
    .toLowerCase()
    .trim();

  const phone = normalizeIsraeliPhone(payload.phone);

  const password = String(payload.password || '').trim();

  const role = getAllowedRoleToCreate(payload.role, actorUser);
  const building_id = await resolveBuildingIdForNewUser(payload, actorUser);

  assert(full_name.length >= 2, 'Full name is required', 400);
  assert(isEmail(email), 'Invalid email format', 400);
  assert(isValidPhone(phone), 'Invalid phone format', 400);
  assert(isStrongPassword(password), 'Password is too weak', 400);

  return await withTransaction(async (conn) => {
    assert(!(await Repo.existsById(user_id)), 'User ID already exists', 409, ErrorCodes.CONFLICT);
    assert(!(await Repo.existsByEmail(email)), 'Email already registered', 409, ErrorCodes.CONFLICT);
    assert(!(await Repo.existsByPhone(phone)), 'Phone number already in use', 409, ErrorCodes.CONFLICT);

    const password_hash = await bcrypt.hash(password, saltRounds);

    await Repo.insertUser(
      {
        user_id,
        full_name,
        email,
        phone,
        password_hash,
        role,
        building_id,
        created_by: actorUser.user_id,
        is_active: 1,
      },
      conn,
    );

    return {
      ok: true,
      message: role === 'manager' ? 'Manager created successfully' : 'User created successfully',
    };
  });
}

export async function toggleUserStatusService(target_id, isActive, actorUser) {
  assertCanManageUsers(actorUser);

  const user_id = assertValidId(target_id);

  assert(String(user_id) !== String(actorUser.user_id), 'You cannot change your own status', 400);
  assert(typeof isActive === 'boolean', 'is_active must be boolean', 400);

  const targetUser = await Repo.getUserById(user_id);
  assert(targetUser, 'User not found', 404);

  await assertCanChangeTargetStatus(actorUser, targetUser);

  return await withTransaction(async (conn) => {
    await Repo.updateUserFields(user_id, { is_active: isActive ? 1 : 0 }, conn);

    return {
      ok: true,
      message: isActive ? 'User activated' : 'User deactivated',
    };
  });
}

export async function transferUserBuildingService(target_id, building_id_raw, actorUser) {
  assertActor(actorUser);
  assert(actorUser.role === 'super', 'Forbidden: Super only', 403);

  const user_id = assertValidId(target_id);

  const targetUser = await Repo.getUserById(user_id);
  assert(targetUser, 'User not found', 404);
  assert(targetUser.role !== 'super', 'Cannot transfer super user', 403);

  let building_id = null;

  if (building_id_raw !== null && building_id_raw !== undefined && building_id_raw !== '') {
    building_id = assertValidBuildingId(building_id_raw);

    const building = await getBuildingById(building_id);
    assert(building, 'Building not found', 404);
    assert(building.is_active === 1, 'Building is inactive', 400);
  }

  return await withTransaction(async (conn) => {
    await Repo.updateUserFields(user_id, { building_id }, conn);

    return {
      ok: true,
      message: building_id
        ? 'User transferred to building successfully'
        : 'User removed from building successfully',
    };
  });
}

/*
Future option:
Password reset by manager or super.
*/

/* src/modules/lockers/lockersRepo.js */
import db_pool from '../../db/db_connection.js';

/* ============================================================
   Lockers Repository
   ============================================================ */

export async function getLockerById(locker_id) {
  const [rows] = await db_pool.execute(
    `
    SELECT
      l.*,
      b.name AS building_name,
      b.city AS building_city,
      b.address AS building_address,
      b.manager_id
    FROM lockers l
    LEFT JOIN buildings b ON b.building_id = l.building_id
    WHERE l.locker_id = ?
    LIMIT 1
    `,
    [locker_id],
  );

  return rows[0] ?? null;
}

export async function getLockerForUpdate(locker_id, conn) {
  const [rows] = await conn.execute(
    `
    SELECT *
    FROM lockers
    WHERE locker_id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [locker_id],
  );

  return rows[0] ?? null;
}

export async function listLockers(filters = {}) {
  const params = [];

  let sql = `
    SELECT
      l.*,
      b.name AS building_name,
      b.city AS building_city,
      b.address AS building_address,
      b.manager_id
    FROM lockers l
    LEFT JOIN buildings b ON b.building_id = l.building_id
    WHERE 1 = 1
  `;

  if (filters.building_id) {
    sql += ` AND l.building_id = ?`;
    params.push(filters.building_id);
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.status) {
    sql += ` AND l.status = ?`;
    params.push(filters.status);
  }

  if (filters.is_active !== undefined) {
    sql += ` AND l.is_active = ?`;
    params.push(Number(filters.is_active));
  }

  if (filters.search) {
    sql += `
      AND (
        l.locker_number LIKE ?
        OR l.notes LIKE ?
        OR b.name LIKE ?
        OR b.city LIKE ?
      )
    `;

    const search = `%${String(filters.search).trim()}%`;
    params.push(search, search, search, search);
  }

  sql += `
    ORDER BY l.building_id ASC, l.locker_number ASC
    LIMIT ? OFFSET ?
  `;

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  params.push(limit, offset);

  const [rows] = await db_pool.execute(sql, params);

  return rows;
}

export async function countLockers(filters = {}) {
  const params = [];

  let sql = `
    SELECT COUNT(*) AS total
    FROM lockers l
    LEFT JOIN buildings b ON b.building_id = l.building_id
    WHERE 1 = 1
  `;

  if (filters.building_id) {
    sql += ` AND l.building_id = ?`;
    params.push(filters.building_id);
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.status) {
    sql += ` AND l.status = ?`;
    params.push(filters.status);
  }

  if (filters.is_active !== undefined) {
    sql += ` AND l.is_active = ?`;
    params.push(Number(filters.is_active));
  }

  if (filters.search) {
    sql += `
      AND (
        l.locker_number LIKE ?
        OR l.notes LIKE ?
        OR b.name LIKE ?
        OR b.city LIKE ?
      )
    `;

    const search = `%${String(filters.search).trim()}%`;
    params.push(search, search, search, search);
  }

  const [rows] = await db_pool.execute(sql, params);

  return Number(rows[0]?.total || 0);
}

export async function existsLockerNumberInBuilding(building_id, locker_number) {
  const [rows] = await db_pool.execute(
    `
    SELECT 1
    FROM lockers
    WHERE building_id = ?
      AND locker_number = ?
    LIMIT 1
    `,
    [building_id, locker_number],
  );

  return rows.length > 0;
}

export async function insertLocker({ building_id, locker_number, notes = null, created_by = null, is_active = 1 }, conn = null) {
  const executor = conn || db_pool;

  const [res] = await executor.execute(
    `
    INSERT INTO lockers (
      building_id,
      locker_number,
      status,
      is_active,
      notes,
      created_by
    )
    VALUES (?, ?, 'available', ?, ?, ?)
    `,
    [building_id, locker_number, is_active, notes, created_by],
  );

  return res.insertId;
}

export async function updateLockerFields(locker_id, patch = {}, conn = null) {
  const executor = conn || db_pool;

  const allowedFields = ['locker_number', 'status', 'is_active', 'notes', 'last_opened_at', 'last_opened_by'];

  const keys = Object.keys(patch).filter((key) => allowedFields.includes(key) && patch[key] !== undefined);

  if (keys.length === 0) {
    return false;
  }

  const sets = keys.map((key) => `${key} = ?`);
  const params = keys.map((key) => patch[key]);

  params.push(locker_id);

  const [res] = await executor.execute(
    `
    UPDATE lockers
    SET ${sets.join(', ')},
        updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = ?
    `,
    params,
  );

  return res.affectedRows === 1;
}

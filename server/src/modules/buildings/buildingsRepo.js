/* src/modules/buildings/buildingsRepo.js */
import db_pool from '../../db/db_connection.js';

/* ============================================================
   Buildings Repository
   ============================================================ */

export async function getBuildingById(building_id) {
  const [rows] = await db_pool.execute(
    `
    SELECT *
    FROM buildings
    WHERE building_id = ?
    LIMIT 1
    `,
    [building_id],
  );

  return rows[0] ?? null;
}

export async function listBuildings(filters = {}) {
  const params = [];

  let sql = `
    SELECT
      b.building_id,
      b.name,
      b.city,
      b.address,
      b.manager_id,
      b.is_active,
      b.created_by,
      b.created_at,
      b.updated_at,
      u.full_name AS manager_name,
      u.email AS manager_email,
      u.phone AS manager_phone
    FROM buildings b
    LEFT JOIN users u ON u.user_id = b.manager_id
    WHERE 1 = 1
  `;

  if (filters.is_active !== undefined) {
    sql += ` AND b.is_active = ?`;
    params.push(Number(filters.is_active));
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.search) {
    sql += `
      AND (
        b.name LIKE ?
        OR b.city LIKE ?
        OR b.address LIKE ?
        OR u.full_name LIKE ?
      )
    `;

    const search = `%${String(filters.search).trim()}%`;
    params.push(search, search, search, search);
  }

  sql += `
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  params.push(limit, offset);

  const [rows] = await db_pool.execute(sql, params);

  return rows;
}

export async function countBuildings(filters = {}) {
  const params = [];

  let sql = `
    SELECT COUNT(*) AS total
    FROM buildings b
    LEFT JOIN users u ON u.user_id = b.manager_id
    WHERE 1 = 1
  `;

  if (filters.is_active !== undefined) {
    sql += ` AND b.is_active = ?`;
    params.push(Number(filters.is_active));
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.search) {
    sql += `
      AND (
        b.name LIKE ?
        OR b.city LIKE ?
        OR b.address LIKE ?
        OR u.full_name LIKE ?
      )
    `;

    const search = `%${String(filters.search).trim()}%`;
    params.push(search, search, search, search);
  }

  const [rows] = await db_pool.execute(sql, params);

  return Number(rows[0]?.total || 0);
}

export async function insertBuilding({ name, city, address, manager_id = null, created_by = null, is_active = 1 }, conn = null) {
  const executor = conn || db_pool;

  const [res] = await executor.execute(
    `
    INSERT INTO buildings (
      name,
      city,
      address,
      manager_id,
      is_active,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, city, address, manager_id, is_active, created_by],
  );

  return res.insertId;
}

export async function updateBuildingFields(building_id, patch = {}, conn = null) {
  const executor = conn || db_pool;

  const allowedFields = ['name', 'city', 'address', 'manager_id', 'is_active'];

  const keys = Object.keys(patch).filter((key) => allowedFields.includes(key) && patch[key] !== undefined);

  if (keys.length === 0) {
    return false;
  }

  const sets = keys.map((key) => `${key} = ?`);
  const params = keys.map((key) => patch[key]);

  params.push(building_id);

  const [res] = await executor.execute(
    `
    UPDATE buildings
    SET ${sets.join(', ')},
        updated_at = CURRENT_TIMESTAMP
    WHERE building_id = ?
    `,
    params,
  );

  return res.affectedRows === 1;
}

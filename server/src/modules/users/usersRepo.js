/* src/modules/users/usersRepo.js */
import db_pool from '../../db/db_connection.js';

/* ============================================================
   Users Repository
   ============================================================ */

export async function getUserById(user_id) {
  const [rows] = await db_pool.execute(
    `
    SELECT *
    FROM users
    WHERE user_id = ?
    LIMIT 1
    `,
    [user_id],
  );

  return rows[0] ?? null;
}

export async function getUserByEmail(email) {
  const [rows] = await db_pool.execute(
    `
    SELECT *
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

export async function listUsers(filters = {}) {
  const params = [];

  let sql = `
    SELECT
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.role,
      u.building_id,
      b.name AS building_name,
      u.is_active,
      u.created_by,
      u.last_login_at,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN buildings b ON b.building_id = u.building_id
    WHERE 1 = 1
  `;

  if (Array.isArray(filters.roles) && filters.roles.length > 0) {
    sql += ` AND u.role IN (${filters.roles.map(() => '?').join(', ')})`;
    params.push(...filters.roles);
  }

  if (filters.building_id) {
    sql += ` AND u.building_id = ?`;
    params.push(filters.building_id);
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.search) {
    sql += `
      AND (
        u.user_id LIKE ?
        OR u.full_name LIKE ?
        OR u.email LIKE ?
        OR u.phone LIKE ?
        OR b.name LIKE ?
      )
    `;

    const search = `%${String(filters.search).trim()}%`;
    params.push(search, search, search, search, search);
  }

  sql += `
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  params.push(limit, offset);

  const [rows] = await db_pool.execute(sql, params);

  return rows;
}

export async function countUsers(filters = {}) {
  const params = [];

  let sql = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN buildings b ON b.building_id = u.building_id
    WHERE 1 = 1
  `;

  if (Array.isArray(filters.roles) && filters.roles.length > 0) {
    sql += ` AND u.role IN (${filters.roles.map(() => '?').join(', ')})`;
    params.push(...filters.roles);
  }

  if (filters.building_id) {
    sql += ` AND u.building_id = ?`;
    params.push(filters.building_id);
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.search) {
    sql += `
      AND (
        u.user_id LIKE ?
        OR u.full_name LIKE ?
        OR u.email LIKE ?
        OR u.phone LIKE ?
        OR b.name LIKE ?
      )
    `;

    const search = `%${String(filters.search).trim()}%`;
    params.push(search, search, search, search, search);
  }

  const [rows] = await db_pool.execute(sql, params);

  return Number(rows[0]?.total || 0);
}

export async function existsById(user_id) {
  const [rows] = await db_pool.execute(
    `
    SELECT 1
    FROM users
    WHERE user_id = ?
    LIMIT 1
    `,
    [user_id],
  );

  return rows.length > 0;
}

export async function existsByEmail(email) {
  const [rows] = await db_pool.execute(
    `
    SELECT 1
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email],
  );

  return rows.length > 0;
}

export async function existsByPhone(phone) {
  const [rows] = await db_pool.execute(
    `
    SELECT 1
    FROM users
    WHERE phone = ?
    LIMIT 1
    `,
    [phone],
  );

  return rows.length > 0;
}

export async function insertUser(
  {
    user_id,
    full_name,
    phone,
    email,
    password_hash,
    role = 'user',
    building_id = null,
    created_by = null,
    is_active = 1,
  },
  conn = null,
) {
  const executor = conn || db_pool;

  const [res] = await executor.execute(
    `
    INSERT INTO users (
      user_id,
      full_name,
      phone,
      email,
      password_hash,
      role,
      building_id,
      is_active,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user_id,
      full_name,
      phone,
      email,
      password_hash,
      role,
      building_id,
      is_active,
      created_by,
    ],
  );

  return res.affectedRows === 1;
}

export async function updateUserFields(user_id, patch = {}, conn = null) {
  const executor = conn || db_pool;

  const allowedFields = [
    'full_name',
    'phone',
    'email',
    'is_active',
    'building_id',
  ];

  const keys = Object.keys(patch).filter(
    (key) => allowedFields.includes(key) && patch[key] !== undefined,
  );

  if (keys.length === 0) {
    return false;
  }

  const sets = keys.map((key) => `${key} = ?`);
  const params = keys.map((key) => patch[key]);

  params.push(user_id);

  const [res] = await executor.execute(
    `
    UPDATE users
    SET ${sets.join(', ')},
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
    `,
    params,
  );

  return res.affectedRows === 1;
}

export async function updateUserPassword(user_id, password_hash, conn = null) {
  const executor = conn || db_pool;

  const [res] = await executor.execute(
    `
    UPDATE users
    SET password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
    `,
    [password_hash, user_id],
  );

  return res.affectedRows === 1;
}

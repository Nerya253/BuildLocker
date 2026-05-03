/* src/modules/lockers/lockerEventsRepo.js */
import db_pool from '../../db/db_connection.js';

/* ============================================================
   Locker Events Repository
   ============================================================ */

export async function insertLockerEvent({ locker_id, user_id, event_type, details = null }, conn = null) {
  const executor = conn || db_pool;

  const [res] = await executor.execute(
    `
    INSERT INTO locker_events (
      locker_id,
      user_id,
      event_type,
      details
    )
    VALUES (?, ?, ?, ?)
    `,
    [locker_id, user_id, event_type, details ? JSON.stringify(details) : null],
  );

  return res.insertId;
}

export async function listLockerEvents(filters = {}) {
  const params = [];

  let sql = `
    SELECT
      e.*,
      u.full_name AS user_name,
      u.email AS user_email,
      l.locker_number,
      b.name AS building_name
    FROM locker_events e
    LEFT JOIN users u ON u.user_id = e.user_id
    LEFT JOIN lockers l ON l.locker_id = e.locker_id
    LEFT JOIN buildings b ON b.building_id = l.building_id
    WHERE 1 = 1
  `;

  if (filters.locker_id) {
    sql += ` AND e.locker_id = ?`;
    params.push(filters.locker_id);
  }

  if (filters.user_id) {
    sql += ` AND e.user_id = ?`;
    params.push(filters.user_id);
  }

  if (filters.building_id) {
    sql += ` AND l.building_id = ?`;
    params.push(filters.building_id);
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.event_type) {
    sql += ` AND e.event_type = ?`;
    params.push(filters.event_type);
  }

  if (filters.from_date) {
    sql += ` AND e.created_at >= ?`;
    params.push(filters.from_date);
  }

  if (filters.to_date) {
    sql += ` AND e.created_at <= ?`;
    params.push(filters.to_date);
  }

  sql += `
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;

  params.push(limit, offset);

  const [rows] = await db_pool.execute(sql, params);

  return rows;
}

export async function countLockerEvents(filters = {}) {
  const params = [];

  let sql = `
    SELECT COUNT(*) AS total
    FROM locker_events e
    LEFT JOIN lockers l ON l.locker_id = e.locker_id
    LEFT JOIN buildings b ON b.building_id = l.building_id
    WHERE 1 = 1
  `;

  if (filters.locker_id) {
    sql += ` AND e.locker_id = ?`;
    params.push(filters.locker_id);
  }

  if (filters.user_id) {
    sql += ` AND e.user_id = ?`;
    params.push(filters.user_id);
  }

  if (filters.building_id) {
    sql += ` AND l.building_id = ?`;
    params.push(filters.building_id);
  }

  if (filters.manager_id) {
    sql += ` AND b.manager_id = ?`;
    params.push(filters.manager_id);
  }

  if (filters.event_type) {
    sql += ` AND e.event_type = ?`;
    params.push(filters.event_type);
  }

  if (filters.from_date) {
    sql += ` AND e.created_at >= ?`;
    params.push(filters.from_date);
  }

  if (filters.to_date) {
    sql += ` AND e.created_at <= ?`;
    params.push(filters.to_date);
  }

  const [rows] = await db_pool.execute(sql, params);

  return Number(rows[0]?.total || 0);
}

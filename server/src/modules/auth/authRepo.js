/* src/modules/auth/authRepo.js */
import db_pool from '../../db/db_connection.js';

/* ============================================================
   Auth Repository
   ============================================================ */

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

export async function updateLastLoginAt(user_id) {
  const [res] = await db_pool.execute(
    `
    UPDATE users
    SET last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
    `,
    [user_id],
  );

  return res.affectedRows === 1;
}

/*
Future option:
Needed only when forgot-password becomes active.

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
*/

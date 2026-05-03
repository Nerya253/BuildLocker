/* src/db/db_connection.js */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const db_pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'buildlocker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

(async () => {
  let connection;

  try {
    connection = await db_pool.getConnection();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
})();

export async function withTransaction(callback) {
  const connection = await db_pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();

    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Transaction rollback failed:', rollbackError.message);
    }

    throw error;
  } finally {
    connection.release();
  }
}

export default db_pool;

import 'dotenv/config'; // Make sure connection information is populated.
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_SERVER,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : undefined,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: 'cookbook',
});

export default pool;

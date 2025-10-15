import { configDotenv } from "dotenv";
import { Pool } from "pg";

configDotenv();

export const JWT_SECRET = process.env.JWT_SECRET as string;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export default pool;

import * as mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "testgen",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

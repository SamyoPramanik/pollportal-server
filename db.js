import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    user: "user",
    host: "localhost",
    database: "polldb",
    password: "password",
    port: 5432,
});

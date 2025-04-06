import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        let sql = `SELECT * FROM USERS WHERE ID = $1 AND STD_ID = $2 AND NAME = $3`;
        let result = await pool.query(sql, [user.id, user.std_id, user.name]);
        if (result.rows.length > 0) {
            next();
        } else {
            res.status(403).json("Access Token verification failed");
        }
    } catch (err) {
        console.log(err);
        res.status(403).json("Access Token verification failed");
        return;
    }
};

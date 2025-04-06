import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const verifyEmail = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        console.log(user);
        let sql = `SELECT * FROM USERS WHERE ID = $1 AND STD_ID = $2 AND VERIFIED = 'YES'`;
        let result = await pool.query(sql, [user.id, user.std_id]);
        if (result.rows.length > 0) {
            next();
        } else {
            res.status(403).json("Unverified Account");
        }
    } catch (err) {
        console.log(err);
        res.status(403).json("Unverified Account");
        return;
    }
};

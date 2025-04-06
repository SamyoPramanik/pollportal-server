import pkg from "jsonwebtoken";
import { pool } from "../db.js";
const { sign, verify } = pkg;

export const verifyCreator = async (req, res, next) => {
    try {
        const poll_id = req.params.id;
        const user_id = req.user.id;

        let sql = `SELECT * FROM MODERATIONS WHERE POLL_ID = $1 AND STD_ID = $2 AND ROLE = 'CREATOR'
`;
        let result = await pool.query(sql, [poll_id, user_id]);

        if (result.rows.length == 1) next();
        else {
            res.status(401).json("not creator");
        }
    } catch (err) {
        console.log(err);
        res.status(403).json("Not creator");
        return;
    }
};

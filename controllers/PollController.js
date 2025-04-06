import { json } from "express";
import { pool } from "../db.js";

export const getPoll = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `SELECT * FROM POLL WHERE ID = $1 LIMIT 1`;
        let result = await pool.query(sql, [poll_id]);
        if (result.rows.length == 1) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const getGroups = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `SELECT * FROM GROUPS WHERE POLL_ID = $1`;
        let result = await pool.query(sql, [poll_id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const getOptions = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `SELECT * FROM OPTIONS WHERE POLL_ID = $1`;
        let result = await pool.query(sql, [poll_id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const addModerator = async (req, res) => {
    try {
        const poll_id = req.params.id;
        const std_id = req.params.std_id;

        if (isVerified(std_id) == false) {
            res.status(400).json("user not verified");
            return;
        }
        let sql = `INSERT INTO MODERATIONS(POLL_ID, STD_ID) VALUES($1, $2) RETURNING *`;
        let result = await pool.query(sql, [poll_id, std_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const removeModerator = async (req, res) => {
    try {
        const poll_id = req.params.id;
        const std_id = req.params.std_id;
        let sql = `DELETE FROM MODERATIONS WHERE POLL_ID = $1 AND STD_ID = $2 AND ROLE = 'MODERATOR' RETURNING *`;
        let result = await pool.query(sql, [poll_id, std_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const addOption = async (req, res) => {
    try {
        const poll_id = req.params.id;

        if ((await isStarted(poll_id)) == true) {
            res.status(400).json(
                "You can't remove group after the poll started"
            );
            return;
        }

        const { text } = req.body;
        let sql = `INSERT INTO OPTIONS(POLL_ID, TEXT) VALUES($1, $2) RETURNING *`;
        let result = await pool.query(sql, [poll_id, text]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const removeOption = async (req, res) => {
    try {
        const poll_id = req.params.id;

        if ((await isStarted(poll_id)) == true) {
            res.status(400).json(
                "You can't remove option after the poll started"
            );
            return;
        }

        const option_id = req.params.option_id;
        let sql = `DELETE FROM OPTIONS WHERE ID = $1 RETURNING *`;
        let result = await pool.query(sql, [option_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const addGroup = async (req, res) => {
    try {
        const poll_id = req.params.id;

        if ((await isStarted(poll_id)) == true) {
            res.status(400).json(
                "You can't remove group after the poll started"
            );
            return;
        }

        const { min_stdid, max_stdid, point } = req.body;
        let sql = `INSERT INTO GROUPS(POLL_ID, MIN_STDID, MAX_STDID, POINT) VALUES($1, $2, $3, $4) RETURNING *`;
        let result = await pool.query(sql, [
            poll_id,
            min_stdid,
            max_stdid,
            point,
        ]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const removeGroup = async (req, res) => {
    try {
        const poll_id = req.params.id;

        if ((await isStarted(poll_id)) == true) {
            res.status(400).json(
                "You can't remove group after the poll started"
            );
            return;
        }

        const group_id = req.params.group_id;
        let sql = `DELETE FROM GROUPS WHERE ID = $1 RETURNING *`;
        let result = await pool.query(sql, [group_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const getResult = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `SELECT * FROM OPTIONS WHERE POLL_ID = $1 ORDER BY SCORE DESC`;
        let result = await pool.query(sql, [poll_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const giveVote = async (req, res) => {
    // need update for multiple selections
    try {
        const poll_id = req.params.id;
        const id = req.user.id;
        const std_id = req.user.std_id;
        const { option_id } = req.body;
        if (await canVote(id, std_id, poll_id, option_id)) {
            console.log("can vote");
            await pool.query("BEGIN");
            let sql = `UPDATE OPTIONS SET SCORE = SCORE + (SELECT POINT FROM GROUPS WHERE MIN_STDID <= $1 AND MAX_STDID >= $2 AND POLL_ID = $3 ORDER BY POINT DESC LIMIT 1) WHERE POLL_ID = $4 AND ID = $5 RETURNING *`;

            let result = await pool.query(sql, [
                std_id,
                std_id,
                poll_id,
                poll_id,
                option_id,
            ]);

            console.log("score updated");

            if (result.rows.length > 0) {
                sql = `INSERT INTO VOTED(STD_ID, POLL_ID) VALUES($1, $2)RETURNING *`;
                let result1 = await pool.query(sql, [id, poll_id]);
                console.log("votting done");
                if (result1.rows.length > 0) {
                    await pool.query("COMMIT");
                    console.log("db updated");
                    res.status(200).json(result.rows[0]);
                }
            } else {
                res.status(400).json("Voting Failed. Please try again later");
            }
        } else {
            res.status(401).json("You can't vote");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const update = async (req, res) => {
    try {
        const poll_id = req.params.id;

        const {
            title,
            started_at,
            finished_at,
            visibility,
            result_visibility,
            min_select,
            max_select,
        } = req.body;
        let sql = `UPDATE POLL SET TITLE = $1, STARTED_AT  = $2::timestamp AT TIME ZONE 'Asia/Dhaka', FINISHED_AT = $3::timestamp AT TIME ZONE 'Asia/Dhaka', VISIBILITY = $4, RESULT_VISIBILITY = $5, MIN_SELECT = $6, MAX_SELECT = $7 WHERE ID = $8 RETURNING *`;
        let placeholders = [
            title,
            started_at,
            finished_at,
            visibility,
            result_visibility,
            min_select,
            max_select,
            poll_id,
        ];

        if (await isStarted(poll_id)) {
            console.log("poll is started");
            sql = `UPDATE POLL SET TITLE = $1, VISIBILITY = $2, RESULT_VISIBILITY = $3 WHERE ID = $4 RETURNING *`;
            placeholders = [title, visibility, result_visibility, poll_id];
        }

        let result = await pool.query(sql, placeholders);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const getModerators = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `SELECT U.ID, U.STD_ID, U.NAME, M.ROLE FROM MODERATIONS M JOIN USERS U ON M.STD_ID = U.ID WHERE POLL_ID = $1`;
        let result = await pool.query(sql, [poll_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const getSubpolls = async (req, res) => {};

export const removeSubpoll = async (req, res) => {};

export const addSubpoll = async (req, res) => {};

export const getVoters = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `SELECT U.ID, NAME, U.STD_ID, VOTED_AT FROM USERS U JOIN VOTED V ON U.ID = V.STD_ID AND V.POLL_ID = $1
`;
        let result = await pool.query(sql, [poll_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json("Poll not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const deletePoll = async (req, res) => {
    try {
        const poll_id = req.params.id;
        let sql = `BEGIN`;
        let result = await pool.query(sql);

        sql = `DELETE FROM POLL WHERE ID = $1`;
        result = await pool.query(sql, [poll_id]);

        sql = `DELETE FROM GROUPS WHERE POLL_ID = $1`;
        result = await pool.query(sql, [poll_id]);

        sql = `DELETE FROM MODERATIONS WHERE POLL_ID = $1`;
        result = await pool.query(sql, [poll_id]);

        sql = `DELETE FROM VOTED WHERE POLL_ID = $1`;
        result = await pool.query(sql, [poll_id]);

        sql = `DELETE FROM OPTIONS WHERE POLL_ID = $1`;
        result = await pool.query(sql, [poll_id]);

        sql = `COMMIT`;
        result = await pool.query(sql);

        res.status(200).json("Poll deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const availableMod = async (req, res) => {
    try {
        const poll_id = req.params.id;
        const { q } = req.query;
        const searchPattern = `%${q}%`;

        console.log(searchPattern);

        let sql = `SELECT ID, NAME, STD_ID, EMAIL FROM USERS U WHERE VERIFIED = 'YES' AND LOWER(NAME) LIKE $1 AND NOT EXISTS(SELECT 1 FROM MODERATIONS WHERE POLL_ID = $2 AND STD_ID = U.ID) ORDER BY NAME ASC LIMIT 10`;

        let result = await pool.query(sql, [searchPattern, poll_id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json("no user found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Internal server error");
    }
};

export const resultAvailable = async (req, res) => {
    try {
        const poll_id = req.params.id;
        const id = req.user.id;
        const std_id = req.user.std_id;

        let sql = `SELECT * FROM POLL WHERE ID = $1 AND (EXISTS(SELECT * FROM VOTED WHERE STD_ID = $2 AND POLL_ID = $3) OR (NOT EXISTS(SELECT * FROM GROUPS WHERE MIN_STDID <= $4 AND MAX_STDID >= $5 AND POLL_ID = $6) AND VISIBILITY = 'PUBLIC' AND RESULT_VISIBILITY = 'PUBLIC'))`;
        let result = await pool.query(sql, [
            poll_id,
            id,
            poll_id,
            std_id,
            std_id,
            poll_id,
        ]);

        if (result.rows.length > 0) {
            res.status(200).json("yes");
        } else res.status(401).json("no");
    } catch (err) {
        console.log(err);
        res.status(401).json("no");
    }
};

const canVote = async (id, std_id, poll_id, option_id) => {
    try {
        console.log(id, std_id, poll_id, option_id);
        let vote_possible = true;
        let sql = `SELECT * FROM GROUPS WHERE MIN_STDID <= $1 AND MAX_STDID >= $2 AND NOT EXISTS(SELECT 1 FROM VOTED WHERE STD_ID = $3 AND POLL_ID = $4) AND EXISTS(SELECT 1 FROM POLL WHERE STARTED_AT <= NOW() AND FINISHED_AT >= NOW() AND ID = $5) AND POLL_ID = $6`;

        let result = await pool.query(sql, [
            std_id,
            std_id,
            id,
            poll_id,
            poll_id,
            poll_id,
        ]);

        if (result.rows.length <= 0) {
            console.log("can't vote");
            vote_possible = false;
            return false;
        }
        console.log("can vote");
        sql = `SELECT * FROM OPTIONS WHERE ID = $1 AND POLL_ID = $2`;

        result = await pool.query(sql, [option_id, poll_id]);

        if (result.rows.length <= 0) {
            vote_possible = false;
            return false;
        }

        return vote_possible;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const isStarted = async (poll_id) => {
    try {
        const sql = `SELECT * FROM POLL WHERE EXISTS(SELECT 1 FROM VOTED WHERE POLL_ID = $1)`;
        const result = await pool.query(sql, [poll_id]);

        if (result.rows.length > 0) return true;
        return false;
    } catch (err) {
        console.log(err);
        return true;
    }
};

const isVerified = async (id) => {
    try {
        const sql = `SELECT * FROM USERS WHERE ID = $1 AND VERIFIED = 'YES`;
        const result = await pool.query(sql, [id]);

        if (result.rows.length > 0) return true;
        return false;
    } catch (err) {
        console.log(err);
        return true;
    }
};

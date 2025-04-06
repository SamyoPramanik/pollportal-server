import { pool } from "../db.js";
import pkg from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
const { sign, verify } = pkg;
dotenv.config();

export const signIn = async (req, res) => {
    try {
        console.log("signing in");
        const { student_id, password } = req.body;
        console.log(req.body);

        let sql = `SELECT ID, NAME, STD_ID, EMAIL, VERIFIED FROM USERS WHERE STD_ID = $1 AND PASSWORD = $2 LIMIT 1`;
        let result = await pool.query(sql, [student_id, password]);

        if (result.rows.length == 1) {
            const user = result.rows[0];
            if (user.verified == "NO") {
                await sendOtp(user.email);
            }
            const token = sign(user, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });

            console.log(token);
            res.status(200).cookie("token", token).json("SignIn successful");
        } else {
            res.status(404).json("Invalid credentials");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("server error, please try again later");
    }
};

export const signUp = async (req, res) => {
    try {
        const { student_name, student_id, student_email, password } = req.body;

        console.log(req.body);

        if (isNaN(student_id)) {
            res.status(400).json("Invalid Student Id");
            return;
        }

        if (!student_email || student_email.length < 12) {
            res.status(400).json(
                "Invalid email. Try with your institutional email"
            );
            return;
        }

        const id_from_email = student_email.substring(0, 7);
        if (student_id != id_from_email) {
            res.status(400).json(
                "Invalid email. Try with your institutional email"
            );
            return;
        }
        if (password.length < 8) {
            res.status(400).json(
                "password too short, Use atleast 8 characters"
            );
            return;
        }

        let sql = `SELECT * FROM USERS WHERE STD_ID = $1`;
        let result = await pool.query(sql, [student_id]);

        console.log("checking duplication");

        if (result.rows.length == 0) {
            sql = `INSERT INTO USERS(NAME, STD_ID, EMAIL, PASSWORD) VALUES($1, $2, $3, $4) RETURNING ID, NAME, STD_ID, EMAIL, VERIFIED`;

            console.log("new user, entering in db");

            result = await pool.query(sql, [
                student_name,
                student_id,
                student_email,
                password,
            ]);

            console.log("user added in db");

            if (result.rows.length > 0)
                res.status(200).json("user signed up successfully");
        } else if (result.rows[0].verified == "NO") {
            sql = `UPDATE USERS SET NAME = $1, EMAIL = $2, PASSWORD = $3 WHERE STD_ID = $4 RETURNING ID, NAME, STD_ID, EMAIL, VERIFIED`;

            console.log("unverified user, updating in db");

            result = await pool.query(sql, [
                student_name,
                student_email,
                password,
                student_id,
            ]);

            console.log("user added in db");

            if (result.rows.length > 0)
                res.status(200).json("user signed up successfully");
        } else {
            res.status(403).json("User with this student id already exists");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("server error, please try again later");
    }
};

export const signOut = async (req, res) => {
    try {
        res.cookie("token", "");
        res.status(200).json("SignOut successful");
    } catch (err) {
        console.log(err);
        res.status(500).json("server error, please try again later");
    }
};

export const profileInfo = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (err) {
        console.log(err);
        res.status(500).json("server error. Please try again later");
    }
};

const sendOtp = async (email) => {
    try {
        // const email = req.user.email;
        const otp = generateOtp();
        let db_updated = false;

        let sql = `SELECT * FROM OTP WHERE EMAIL = $1`;
        let result = await pool.query(sql, [email]);
        if (result.rows.length > 0) {
            sql = `UPDATE OTP SET OTP_CODE = $1, SENT_AT = NOW() WHERE EMAIL = $2 RETURNING *`;
            result = await pool.query(sql, [otp, email]);
            if (result.rows.length > 0) db_updated = true;
        } else {
            sql = `INSERT INTO OTP(EMAIL, OTP_CODE) VALUES($1, $2) RETURNING *`;
            result = await pool.query(sql, [email, otp]);
            if (result.rows.length > 0) db_updated = true;
        }
        if (db_updated) {
            {
                await sendEmail(email, otp);
                console.log("otp sent to email");
            } // res.status(200).json("otp sent");
        }
    } catch (err) {
        console.log(err);
        // res.status(500).json("Server error. Please try again later");
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const email = req.user.email;
        const { otp } = req.body;
        console.log(email, otp);
        let sql = `SELECT * FROM OTP WHERE EMAIL = $1 AND OTP_CODE = $2 AND SENT_AT > NOW() - INTERVAL '10 minutes'`;
        let result = await pool.query(sql, [email, otp]);
        if (result.rows.length > 0) {
            let sql = `UPDATE USERS SET VERIFIED = 'YES' WHERE EMAIL = $1 RETURNING *`;
            await pool.query("BEGIN");
            result = await pool.query(sql, [email]);
            sql = `DELETE FROM OTP WHERE EMAIL = $1`;
            result = await pool.query(sql, [email]);
            await pool.query("COMMIT");
            res.status(200).json("otp verified");
        } else {
            res.status(400).json("otp verification failed");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Server error. Please try again later");
    }
};

export const updatePassword = async (req, res) => {};

const generateOtp = () => {
    return Math.floor(123456 + Math.random() * 900000);
};

const sendEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.GMAIL_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_ID,
                pass: process.env.GMAIL_PASS,
            },
        });

        const mailBody = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your OTP Code</title>
    </head>
    <body
        style="
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
        "
    >
        <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <table
                        width="100%"
                        style="
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                        "
                    >
                        <tr>
                            <td
                                style="
                                    background-color: #0369a1;
                                    padding: 20px;
                                    text-align: center;
                                    color: #ffffff;
                                "
                            >
                                <h1 style="margin: 0; font-size: 24px">
                                    Your Verification Code for BUET Poll Portal
                                </h1>
                            </td>
                        </tr>
                        <tr>
                            <td
                                style="
                                    padding: 30px;
                                    text-align: center;
                                    color: #333;
                                "
                            >
                                <p style="font-size: 16px">
                                    Use the following OTP to verify your email
                                    address:
                                </p>
                                <p
                                    style="
                                        font-size: 36px;
                                        font-weight: bold;
                                        letter-spacing: 4px;
                                        margin: 20px 0;
                                        color: #0369a1;
                                    "
                                >
                                    ${otp}
                                </p>
                                <p style="font-size: 14px; color: #555">
                                    This OTP is valid for 10 minutes. Please do
                                    not share it with anyone.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td
                                style="
                                    background-color: #f9fafb;
                                    padding: 20px;
                                    text-align: center;
                                    font-size: 12px;
                                    color: #999;
                                "
                            >
                                If you didn't request this, you can ignore this
                                email.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
`;

        const info = await transporter.sendMail({
            from: "Poll in BUET <no-reply-verifymail@gmail.com>",
            to: `${email}`,
            subject: "Verify Email",
            text: "",
            html: mailBody,
        });
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

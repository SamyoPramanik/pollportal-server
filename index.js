import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/AuthRoute.js";
import commonRouter from "./routes/CommonRoute.js";
import PollRouter from "./routes/PollRoute.js";
import { pool } from "./db.js";

const port = 5004;

const app = express();

dotenv.config();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieparser(process.env.COOKIE_SECRET));

app.use("/auth", authRouter);
app.use("/poll", PollRouter);
app.use("/common", commonRouter);

pool.connect()
    .then(() => console.log("database connected"))
    .catch((err) => {
        console.log(err);
    });

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});

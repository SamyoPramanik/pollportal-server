import { Router } from "express";
import {
    createPoll,
    getPoll,
    getPolls,
    getResult,
} from "../controllers/CommonController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyEmail } from "../middlewares/verityEmail.js";

const commonRouter = Router();

commonRouter.get("/polls", verifyToken, verifyEmail, getPolls);
commonRouter.post("/poll/create", verifyToken, verifyEmail, createPoll);
commonRouter.get("/poll/:id", verifyToken, verifyEmail, getPoll);
commonRouter.get("/poll/:id/result", verifyToken, verifyEmail, getResult);

export default commonRouter;

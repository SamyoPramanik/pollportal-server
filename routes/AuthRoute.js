import { Router } from "express";
import {
    profileInfo,
    signIn,
    signOut,
    signUp,
    updatePassword,
    verifyOtp,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const authRouter = Router();

authRouter.post("/sign-in", signIn);
authRouter.post("/sign-up", signUp);
authRouter.get("/sign-out", signOut);
authRouter.get("/profile", verifyToken, profileInfo);
// authRouter.get("/send-otp", verifyToken, sendOtp);
authRouter.post("/verify-otp", verifyToken, verifyOtp);
authRouter.post("update-password", verifyToken, updatePassword);

export default authRouter;

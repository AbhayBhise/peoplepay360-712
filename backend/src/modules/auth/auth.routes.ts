import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { loginRateLimit, sensitiveRateLimit } from "../../middleware/rateLimit";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, authController.login);

authRouter.get("/me", authenticate, authController.me);
authRouter.post("/logout", authenticate, authController.logout);
authRouter.post("/change-password", authenticate, sensitiveRateLimit, authController.changePassword);
authRouter.post("/forgot-password", sensitiveRateLimit, authController.forgotPassword);
authRouter.post("/reset-password", sensitiveRateLimit, authController.resetPassword);

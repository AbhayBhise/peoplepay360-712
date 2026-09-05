import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { loginRateLimit } from "../../middleware/rateLimit";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, authController.login);
authRouter.get("/me", authenticate, authController.me);
authRouter.post("/logout", authenticate, authController.logout);

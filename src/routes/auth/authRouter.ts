import { Router, Request, Response } from "express";
import {
  createAuthToken,
  createUser,
} from "../../controllers/authRoutes.controller";

const authRouter = Router();

// authentication
authRouter.post("/", createAuthToken);

// create a new user
authRouter.post("/create", createUser);

export default authRouter;

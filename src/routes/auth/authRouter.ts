import { Router, Request, Response } from "express";
import { createUser } from "../../controllers/authRoutes.controller";

const authRouter = Router();

// authentication
authRouter.post("/", async (req: Request, res: Response) => {
  res.status(200).json(res.locals.user);
});

// create a new user
authRouter.post("/create", createUser);

export default authRouter;

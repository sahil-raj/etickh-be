import { Router, Request, Response } from "express";
import prisma from "../../utils/prisma/prismaClient";
import { createUser } from "../../controllers/authRoutes.controller";

const authRouter = Router();

authRouter.post("/test", async (req: Request, res: Response) => {
  const users = await prisma.user_account.findMany();
  res.status(200).json(users);
});

// create a new user
authRouter.post("/create", createUser);

export default authRouter;

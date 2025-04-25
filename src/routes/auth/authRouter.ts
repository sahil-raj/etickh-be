import { Router, Request, Response } from "express";
import prisma from "../../utils/prisma/prismaClient";

const authRouter = Router();

authRouter.post("/test", async (req: Request, res: Response) => {
  const users = await prisma.user_account.findMany();
  res.status(200).json(users);
});

export default authRouter;

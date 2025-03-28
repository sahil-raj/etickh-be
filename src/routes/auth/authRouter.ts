import { Router, Request, Response } from "express";

const authRouter = Router();

authRouter.post("/test", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

export default authRouter;

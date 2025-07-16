import { Request, Response } from "express";

export const createEvent = (req: Request, res: Response) => {
  res.status(200).json({ test: res.locals });
  return;
};

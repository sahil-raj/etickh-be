import express from "express";
import { PORT } from "./config/constants/env";
import authenticationMiddleware from "./middlewares/auth/authentication.middleware";
import authRouter from "./routes/auth/authRouter";

const app = express();

app.use("/auth", authenticationMiddleware, authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

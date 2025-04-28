import express from "express";
import { PORT } from "./config/constants/env";

//middlewares
import authenticationMiddleware from "./middlewares/auth/authentication.middleware";
import ratelimit from "./middlewares/ratelimit/ratelimit";

//routers
import authRouter from "./routes/auth/authRouter";

const app = express();

// use json
app.use(express.json());

app.use("/auth", authenticationMiddleware, ratelimit, authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

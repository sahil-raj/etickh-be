import express from "express";
import { PORT } from "./config/constants/env";

//middlewares
import authenticationMiddlewareV2 from "./middlewares/auth/authenticationV2.middleware";
import ratelimit from "./middlewares/ratelimit/ratelimit";

//routers
import authRouter from "./routes/auth/authRouter";
import eventRouter from "./routes/event/eventRouter";

const app = express();

// use json
app.use(express.json());

app.use("/auth", authenticationMiddlewareV2, ratelimit, authRouter);

app.use("/events", ratelimit, eventRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

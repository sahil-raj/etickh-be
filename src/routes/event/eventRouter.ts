import { Router } from "express";
import authenticationMiddlewareV2 from "../../middlewares/auth/authenticationV2.middleware";
import { createEvent } from "../../controllers/eventRoutes.controller";

const eventRouter = Router();

// get all events
// eventRouter.get("/", );

// create event
eventRouter.post("/create", authenticationMiddlewareV2, createEvent);

export default eventRouter;

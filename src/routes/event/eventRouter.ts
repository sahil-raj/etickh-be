import { Router } from "express";
import authenticationMiddleware from "../../middlewares/auth/authentication.middleware";
import { createEvent } from "../../controllers/eventRoutes.controller";

const eventRouter = Router();

// get all events
// eventRouter.get("/", );

// create event
eventRouter.post("/create", authenticationMiddleware, createEvent);

export default eventRouter;

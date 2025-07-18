import { Router } from "express";
import authenticationMiddlewareV2 from "../../middlewares/auth/authenticationV2.middleware";
import {
  //   createEvent,
  getEvents,
} from "../../controllers/eventRoutes.controller";

const eventRouter = Router();

// get all events
eventRouter.get("/", getEvents);

// create event
// eventRouter.post("/create", authenticationMiddlewareV2, createEvent);

export default eventRouter;

import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

/**
 * ratelimitng middleware
 */
const ratelimit: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, //1 minute
  max: 100, //max number of reqs in the window
  message: {
    status: "failed",
    statusCode: 429,
    message: "Too many requests, please try again later.",
  },
});

export default ratelimit;

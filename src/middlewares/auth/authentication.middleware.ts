import { NextFunction, Request, Response } from "express";
import { verifyJWT, generateJWT } from "../../utils/jwt/jwt";

/**
 * This middleware function is used to authenticate the user by verifying the JWT token.
 * @param {Request} req request object
 * @param {Response} res response object
 * @param {NextFunction} next next function
 */

const authenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  //check if the authorization header is present
  if (!req.headers.authorization) {
    res
      .status(401)
      .json({ message: "Unauthorized", error: "No token provided" });
    return;
  }

  //check if the token is sent as a Bearer token
  if (req.headers.authorization.split(" ")[0] !== "Bearer") {
    res.status(401).json({ message: "Unauthorized", error: "Invalid token" });
    return;
  }

  //if the token is sent as a Bearer token, verify the token
  const decodedToken = verifyJWT(req.headers.authorization.split(" ")[1]);

  if (!decodedToken?.evmAddress && !decodedToken?.userId) {
    res.status(401).json({ message: "Unauthorized", error: "Invalid token" });
    return;
  }

  next();
};

export default authenticationMiddleware;

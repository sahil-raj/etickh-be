import { NextFunction, Request, Response } from "express";
import { verifyJWT, generateJWT } from "../../utils/jwt/jwt";
import {
  PRIVY_SIGNING_KEY,
  PRIVY_APP_SECRET,
  PRIVY_APP_ID,
} from "../../config/constants/env";
import prisma from "../../utils/prisma/prismaClient";

/**
 * This middleware function is used to authenticate the user by verifying the JWT token.
 * Checks for Authentication from privy and then issues a JWT which is time-bound and must be sent with each request which requires authentication.
 * @param {Request} req request object
 * @param {Response} res response object
 * @param {NextFunction} next next function
 */

const authenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authToken: string = req.headers.authorization as string;
  const privyToken: string = req.headers["x-privy-jwt"] as string;

  //check if the authorization or privy auth header is present
  if (!(privyToken || authToken)) {
    res
      .status(401)
      .json({ message: "Unauthorized", error: "No token provided" });
    return;
  }

  //check if the token is sent as a Bearer token (for both privy and own jwt)
  if (
    [authToken, privyToken].some(
      (token) => token && !token.startsWith("Bearer ")
    )
  ) {
    res.status(401).json({ message: "Unauthorized", error: "Invalid token" });
    return;
  }

  //check if both the tokens are sent
  if (authToken && privyToken) {
    res
      .status(401)
      .json({ message: "Unauthorized", error: "Multiple tokens found" });
    return;
  }

  //check if the token is auth or privy and then handle the request accordingly
  if (privyToken) {
    try {
      //check if the token is valid and if the token is valid search for the user with the decoded did (sub in privy)
      const decodedToken = verifyJWT(
        privyToken.split(" ")[1],
        {
          issuer: "privy.io",
          audience: PRIVY_APP_ID,
        },
        PRIVY_SIGNING_KEY.replace(/\\n/g, "\n")
      );

      if (decodedToken) {
        const user = await prisma.user_account.findUnique({
          where: {
            sub: decodedToken.sub,
          },
        });

        if (user) {
          // if the user is found then generate a token to return
          //include user-agent and timestamp so that token cannot be used from other user-agents
          const returnToken = generateJWT({
            userId: user?.id as unknown as string,
            evmAddress: user?.evm_address,
            sub: user?.sub as string,
            userAgent: req.headers["user-agent"],
            timestamp: Date.now(),
          });
          console.log(returnToken);
        } else {
          res
            .status(401)
            .json({ message: "Unauthorized", error: "User not found" });
        }
      } else {
        res.status(401).json({
          message: "Unauthorized",
          error: "Privy authentication failed. Try regenerating Privy token",
        });
        return;
      }
    } catch (e) {
      res.status(401).json({ error: e });
      return;
    }
  } else {
    console.log("test");
  }

  next();
};

export default authenticationMiddleware;

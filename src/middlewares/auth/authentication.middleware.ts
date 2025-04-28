import { NextFunction, Response, Request } from "express";
import { verifyJWT, generateJWT } from "../../utils/jwt/jwt";
import { PRIVY_SIGNING_KEY, PRIVY_APP_ID } from "../../config/constants/env";
import prisma from "../../utils/prisma/prismaClient";
import { CreateJWTPayload } from "../../types";
import { createAndStoreWallet } from "../../utils/wallet/walletFunctions";

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

  if (req.url !== "/create") {
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

    //check if user agent exists in req
    if (!req.headers["user-agent"]) {
      res.status(400).json({
        error: "Bad Request",
        message: "User-Agent is required",
      });
      return;
    }

    //check if the token is auth or privy and then handle the request accordingly
    //add redis to store accesstoken so that it is not regenrated everytime if it has life
    if (privyToken) {
      try {
        //check if the token is valid and if the token is valid search for the user with the decoded did (sub in privy)
        const decodedToken = verifyJWT(
          privyToken.split(" ")[1],
          PRIVY_SIGNING_KEY.replace(/\\n/g, "\n"),
          {
            issuer: "privy.io",
            audience: PRIVY_APP_ID,
          }
        );

        if (decodedToken == "expired") {
          res.status(401).json({
            message: "Unauthorized",
            error: "Privy token expired",
          });
          return;
        }

        if (decodedToken) {
          const user = await prisma.user_account.findUnique({
            where: {
              sub: decodedToken.sub,
            },
          });

          if (user) {
            // if the user is found then generate a token to return
            //include user-agent and timestamp so that token cannot be used from other user-agents
            const timestamp = Date.now();
            const returnToken = generateJWT({
              userId: user?.id as unknown as string,
              evmAddress: user?.evm_address,
              sub: user?.sub as string,
              userAgent: req.headers["user-agent"],
              timestamp,
            });
            res.status(200).json({
              message: "ACCESS_TOKEN_CREATED",
              tokenDetails: {
                accessToken: `Bearer ${returnToken}`,
                timestamp,
                userAgent: req.headers["user-agent"],
              },
            });
            return;
          } else {
            res
              .status(401)
              .json({ message: "Unauthorized", error: "User not found" });
            return;
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
      const decodedToken: CreateJWTPayload | null | "expired" = verifyJWT(
        authToken.split(" ")[1]
      );

      //check if the token is valid or not
      if (!decodedToken) {
        res.status(401).json({
          message: "Unauthorized",
          error: "Inavlid request token",
        });
        return;
      }

      //check if the token is valid but expired
      if (decodedToken === "expired") {
        res.status(401).json({
          message: "Unauthorized",
          error: "Access token expired",
        });
        return;
      }

      //check if the req is sent from the same user-agent or not
      if (decodedToken?.userAgent !== req.headers["user-agent"]) {
        //in future blacklist this jwt by using redis
        res
          .status(401)
          .json({ message: "Unauthorized", error: "user-agent mismatch" });
        return;
      }

      //check if that user exists in db
      //in future add redis here so the user is not always fetched from db
      const user = await prisma.user_account.findUnique({
        where: {
          sub: decodedToken?.sub,
          evm_address: decodedToken?.evmAddress,
        },
      });

      if (!user) {
        res
          .status(401)
          .json({ message: "Unauthorized", error: "User not found" });
        return;
      }

      //get user's custodial wallet
      const custodialAddress = await createAndStoreWallet(user?.evm_address);

      //set user in the response object
      res.locals.user = { ...user, custodialAddress };

      //pass on to next middleware if authentication is completed
      next();
    }
  } else {
    // if the user is to be created check just for privy token
    //check if the privy auth header is present and all other related conditions
    if (!privyToken) {
      res
        .status(401)
        .json({ message: "Unauthorized", error: "Privy token not found" });
      return;
    }
    if (
      [privyToken].some((token) => token && !token.startsWith("Bearer ")) &&
      authToken &&
      privyToken
    ) {
      res.status(401).json({
        message: "Unauthorized",
        error: "No/Invalid/multiple token(s) provided",
      });
      return;
    }

    // verify the privy auth token
    const decodedToken = verifyJWT(
      privyToken.split(" ")[1],
      PRIVY_SIGNING_KEY.replace(/\\n/g, "\n"),
      {
        issuer: "privy.io",
        audience: PRIVY_APP_ID,
      }
    );

    if (decodedToken == "expired") {
      res.status(401).json({
        message: "Unauthorized",
        error: "Privy token expired",
      });
      return;
    }

    //pass data to controller
    res.locals.userSub = decodedToken?.sub;

    next();
  }
};

export default authenticationMiddleware;

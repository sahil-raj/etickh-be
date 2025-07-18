import { NextFunction, Request, Response } from "express";
import { verifyJWT } from "../../utils/jwt/jwt";
import { PRIVY_SIGNING_KEY, PRIVY_APP_ID } from "../../config/constants/env";
import prisma from "../../utils/prisma/prismaClient";
import { CreateJWTPayload } from "../../types";
import { createAndStoreWallet } from "../../utils/wallet/walletFunctions";
/**
 * This middleware function is used to authenticate the user by verifying the JWT token.
 * @param {Request} req request object
 * @param {Response} res response object
 * @param {NextFunction} next express next function
 */

const authenticationMiddlewareV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authToken: string = req.headers.authorization as string;
  const privyToken: string = req.headers["x-privy-jwt"] as string;
  let { pathname } = new URL(req.originalUrl, `http://${req.headers.host}`);

  pathname = pathname.replace(/\/+$/, "") || "/";

  // checks for tokens (auth and privy)
  // check if tokens are present or not
  if (!(authToken || privyToken)) {
    res.status(401).json({
      message: "Unauthorized",
      error: "No token provided",
    });
    return;
  }

  // check if the tokens are sent as Bearer token or not (for privy and auth)
  if (
    [authToken, privyToken].some(
      (token) => token && !token.startsWith("Bearer ")
    )
  ) {
    res.status(401).json({ message: "Unauthorized", error: "Invalid token" });
    return;
  }

  // check if both the tokens are sent
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

  //check if the toke is authtoken or privy token and then handle the authentication accordingly
  if (privyToken) {
    try {
      //check if the token is valid and if the token is valid search for the user with the decoded did (sub in privy)
      const decodedToken: CreateJWTPayload | null | "expired" = verifyJWT(
        privyToken.split(" ")[1],
        PRIVY_SIGNING_KEY.replace(/\\n/g, "\n"),
        {
          issuer: "privy.io",
          audience: PRIVY_APP_ID,
        }
      );

      // check if the token is expired
      if (decodedToken == "expired") {
        res.status(401).json({
          message: "Unauthorized",
          error: "Privy token expired",
        });
        return;
      }

      if (decodedToken) {
        // if the token is decoded then check for the path
        if (pathname === "/auth/create") {
          // pass data to the route handler
          res.locals.userSub = decodedToken?.sub;
          next();
        } else if (pathname == "/auth") {
          // search for the user and add it in res.locals.user
          const user = await prisma.user_account.findUnique({
            where: {
              sub: decodedToken.sub,
            },
          });

          if (user) {
            // add user to the res object for usage
            res.locals.user = user;
            // forward to the next middleware
            next();
          } else {
            res.status(401).json({
              error: "Unauthorized",
              message: "User not found",
            });
          }
        } else {
          res.status(401).json({
            message: "Unauthorized",
            error: `${pathname} is not accessible without authtoken`,
          });
          return;
        }
      } else {
        // if the token is not decoded then throw errorenous response
        res.status(401).json({
          message: "Unauthorized",
          error: "Privy authentication failed. Try regenerating Privy token",
        });
        return;
      }
    } catch (e) {
      res.status(500).json({ error: "Internal Server Erorr", message: e });
      return;
    }
  } else {
    // handle creation of token
    // if the user has authtoken don't allow creation of new user as they are already an user
    if (pathname == "/auth/create") {
      res.status(401).json({
        message: "Unauthorized",
        error: "cannot create an user, when already a user",
      });
      return;
    }

    // if holding an auth token don't allow creation of one more
    if (pathname == "/auth") {
      res.status(401).json({
        message: "Unauthorized",
        error: "cannot create an authToken when holding one",
      });
      return;
    }

    // verify the authToken
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
};

export default authenticationMiddlewareV2;

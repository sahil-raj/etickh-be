import { Request, Response } from "express";
import prisma from "../utils/prisma/prismaClient";
import { createAndStoreWallet } from "../utils/wallet/walletFunctions";
import { isAddress } from "viem";
import { CreateJWTPayload } from "../types";
import { generateJWT, verifyJWT } from "../utils/jwt/jwt";
import { PRIVY_SIGNING_KEY, PRIVY_APP_ID } from "../config/constants/env";

/**
 * create a new user using the data provided in body
 * @param {Request} req request object
 * @param {Response} res response object
 */
export const createUser = async (req: Request, res: Response) => {
  // check if the evm address (unique identifier) is provided or not
  if (!req.body?.evmAddress || !isAddress(req.body?.evmAddress)) {
    res.status(400).json({
      message: "Bad Request",
      error: "EVM address not provided or valid",
    });
    return;
  }

  try {
    // check if user already exists or not
    let user = await prisma.user_account.findUnique({
      where: {
        sub: res.locals?.userSub,
      },
    });

    if (user) {
      // if the user already exists throw an conflict
      res.status(409).json({
        message: "Conflict",
        error: `User with sub ${res.locals?.userSub} already exists, cross check evmAddress.`,
      });
      return;
    }

    // create the user with evm address
    user = await prisma.user_account.create({
      data: {
        evm_address: req.body?.evmAddress,
        sub: res.locals?.userSub,
      },
    });

    // create the custodial wallet for user
    const custodialAddress = await createAndStoreWallet(req.body?.evmAddress);

    res.status(201).json({
      message: "User created successfully",
      user: {
        ...user,
        custodialAddress,
      },
    });
    return;
  } catch (e) {
    res.status(500).json({ message: "Internal Server Error", error: e });
    return;
  }
};

/**
 * create authToken for the user on the basis of res.locals.user (as set by the auth middleware)
 * @param {Request} req request object
 * @param {Response} res response object
 */
export const createAuthToken = (req: Request, res: Response) => {
  const privyToken: string = req.headers["x-privy-jwt"] as string;
  const decodedToken: CreateJWTPayload | null | "expired" = verifyJWT(
    privyToken.split(" ")[1],
    PRIVY_SIGNING_KEY.replace(/\\n/g, "\n"),
    {
      issuer: "privy.io",
      audience: PRIVY_APP_ID,
    }
  );
  const user = res.locals.user;

  // following condition will always be true as it is already checked in the auth middleware
  if (decodedToken && decodedToken != "expired" && user) {
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
    res.status(500).json({});
    return;
  }
};

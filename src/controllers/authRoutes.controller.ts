import { Request, Response } from "express";
import prisma from "../utils/prisma/prismaClient";
import { createAndStoreWallet } from "../utils/wallet/walletFunctions";
import { isAddress } from "viem";

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
    // create the user with evm address
    const user = await prisma.user_account.create({
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

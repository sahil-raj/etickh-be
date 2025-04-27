// utility function to create crypto wallet
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { isAddress } from "viem";
import prisma from "../prisma/prismaClient";

/**
 * Create a crypto evm compatible wallet using viem functions
 * and store the address and key in user_wallets table
 * @param {string} userEvm - EVM address of the user against which the custodial wallet will be created
 * @returns {Promise<string | null>} 42 char long EVM compatible address
 */
export const createAndStoreWallet = async (
  userEvm: string
): Promise<string | null> => {
  //check if the address is valid or not
  if (!isAddress(userEvm)) {
    console.error("Invalid evm address");
    return null;
  }

  try {
    //check if user exists in user_account
    const user = await prisma.user_account.findUnique({
      where: {
        evm_address: userEvm,
      },
    });

    //throw error if the user is not found in the user_account table
    if (!user) {
      console.error("user not found in user_account");
      return null;
    }

    //check if the address already exists or not
    const userAddress = await prisma.user_wallets.findUnique({
      where: {
        evm_address: userEvm,
      },
    });

    if (!userAddress) {
      // if user custodial address dosen't exist then make it and update it in db
      const pvtKey = generatePrivateKey();
      const custodialAddress = privateKeyToAccount(pvtKey).address;

      //create the entry for the user
      const userDets = await prisma.user_wallets.create({
        data: {
          evm_address: userEvm,
          custodial_address: custodialAddress,
          pvt_key: pvtKey,
        },
      });

      return userDets?.custodial_address;
    } else {
      return userAddress?.custodial_address;
    }
  } catch (e) {
    console.error(`error accessing db: ${e as string}`);
    return null;
  }
};

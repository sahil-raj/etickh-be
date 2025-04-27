// utility functions to sign, create and verify JWT tokens
import {
  sign,
  TokenExpiredError,
  verify,
  type VerifyOptions,
} from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../../config/constants/env";
import { CreateJWTPayload } from "../../types";

/**
 * Generate a JWT token by signing it with JWT_SECRET_KEY
 * @param {CreateJWTPayload} createJWTPayload - The payload to sign
 * @returns {string | null} The signed JWT token
 */
export const generateJWT = (
  createJWTPayload: CreateJWTPayload
): string | null => {
  //check if the evm address is of specified length or else return null
  if (createJWTPayload && createJWTPayload.evmAddress.length == 42) {
    //sign the payload with the secret key and set the expiration time to 5 minutes
    return sign({ ...createJWTPayload }, JWT_SECRET_KEY, { expiresIn: "5m" });
  } else {
    //if the payload is not valid return null
    return null;
  }
};

/**
 * Verify the JWT token and return the decoded payload
 * @param {string} token - The JWT token to verify
 * @param {VerifyOptions} options - The options for verifying the token as provided by verify function of jsonwebtoken
 * @param {string} key - The key to verify the JWT
 * @returns {CreateJWTPayload | null} The decoded payload or null if verification fails
 */
export const verifyJWT = (
  token: string,
  key: string = JWT_SECRET_KEY,
  options?: VerifyOptions
): CreateJWTPayload | null | "expired" => {
  try {
    //verify the token with the secret key
    const decoded = verify(token, key, options) as CreateJWTPayload;
    //return the decoded payload
    return decoded;
  } catch (error) {
    //check if the token expired
    if (error instanceof TokenExpiredError) return "expired";
    //if verification fails return null
    return null;
  }
};

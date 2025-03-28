// utility functions to sign, create and verify JWT tokens
import { sign, verify } from "jsonwebtoken";
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
    //sign the payload with the secret key and set the expiration time to 24 hours
    return sign({ ...createJWTPayload }, JWT_SECRET_KEY, { expiresIn: "24h" });
  } else {
    //if the payload is not valid return null
    return null;
  }
};

/**
 * Verify the JWT token and return the decoded payload
 * @param {string} token - The JWT token to verify
 * @returns {CreateJWTPayload | null} The decoded payload or null if verification fails
 */
export const verifyJWT = (token: string): CreateJWTPayload | null => {
  try {
    //verify the token with the secret key
    const decoded = verify(token, JWT_SECRET_KEY) as CreateJWTPayload;
    //return the decoded payload
    return decoded;
  } catch (error) {
    //if verification fails return null
    return null;
  }
};

import { Request } from "express";

export type CreateJWTPayload = {
  userId: string;
  evmAddress: string;
  sub: string;
  timestamp?: number;
  userAgent?: string;
};

export interface CustomRequest extends Request {
  user: {
    id: number;
    evm_address: string;
    name: string | null;
    email: string | null;
    sub: string | null;
  };
}

export type CreateJWTPayload = {
  userId: string;
  evmAddress: string;
  sub: string;
  timestamp?: number;
  userAgent?: string;
};

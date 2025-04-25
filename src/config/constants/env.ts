import { configDotenv } from "dotenv";

//configure dotenv
configDotenv();

//load environment variables and export them
export const PORT: string = process.env.PORT as string;
export const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY as string;
export const DATABASE_URL: string = process.env.DATABASE_URL as string;
export const PRIVY_APP_ID: string = process.env.PRIVY_APP_ID as string;
export const PRIVY_APP_SECRET: string = process.env.PRIVY_APP_SECRET as string;
export const PRIVY_SIGNING_KEY: string = process.env
  .PRIVY_SIGNING_KEY as string;

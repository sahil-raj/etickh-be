import { configDotenv } from "dotenv";

//configure dotenv
configDotenv();

//load environment variables and export them
export const PORT: string = process.env.PORT as string;
export const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY as string;

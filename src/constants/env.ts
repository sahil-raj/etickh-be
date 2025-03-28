import { configDotenv } from "dotenv";

//configure dotenv
configDotenv();

//load environment variables and export them
export const PORT = process.env.PORT;

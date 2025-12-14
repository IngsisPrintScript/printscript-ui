import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_FRONTEND_URL || "http://localhost:5173",

    env: {
      FRONTEND_URL: process.env.CYPRESS_FRONTEND_URL,
      BACKEND_URL: process.env.CYPRESS_BACKEND_URL,

      AUTH0_DOMAIN: process.env.CYPRESS_AUTH0_DOMAIN,
      AUTH0_CLIENT_ID: process.env.CYPRESS_AUTH0_CLIENT_ID,
      AUTH0_AUDIENCE: process.env.CYPRESS_AUTH0_AUDIENCE,

      AUTH0_USERNAME: process.env.CYPRESS_AUTH0_USERNAME,
      AUTH0_PASSWORD: process.env.CYPRESS_AUTH0_PASSWORD,
    },
  },
});

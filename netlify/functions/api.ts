import serverless from "serverless-http";
import app from "../../server";

// Wrap our Express.js app inside serverless-http to run as a serverless function on Netlify
export const handler = serverless(app);

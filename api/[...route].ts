// api/[...route].ts
import serverless from "serverless-http";
import app from "../server/serverless";

export default serverless(app);
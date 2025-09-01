// api/[...route].ts
import serverless from "serverless-http";
import app from "../server/index";

export default serverless(app);
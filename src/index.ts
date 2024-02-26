import "dotenv/config";
import "colors";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger/swagger-config";
import connectDB from "./config/DatabaseConfig";
import CustomError from "./config/CustomError";
import globalErrorHandler from "./api/helpers/globalErrorHandler";
import { corsOptions } from "./config/corsOptions";
import { credentials } from "./api/middlewares/credentials";
import StatusCode from "./api/helpers/httpStatusCode";
import router from "./api/routes";
import morgan from "morgan";

process.on("uncaughtException", (err) => {
  console.error(err.name.red.underline, err.message.red.underline);
  console.error("Uncaught Exception occured! Shutting down...".magenta);
  process.exit(1);
});

const API_URL = "/api/v1";

//creating express server
const app = express();

//connecting to db
connectDB();

app.use(compression());

//handle options credentials check before CORS
app.use(credentials);

//cors
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse cookies
app.use(cookieParser());
//logger
app.use(morgan("common"));

//test route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//app router
app.use(`${API_URL}`, router);

//middleware for swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//fallback route
app.all("*", (req, res, next) => {
  const err = new CustomError(
    `Can't find ${req.originalUrl} on the server! Are you sure you wanted to make a ${req.method} request?`,
    StatusCode.NOT_FOUND
  );
  //pass it to global error handler
  next(err);
});

//global error handler
app.use(globalErrorHandler);

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`App listening on port ${port}`.yellow.underline);
});

process.on("unhandledRejection", (err: Error) => {
  console.error(err.name.magenta, err.message.magenta);
  console.error("Unhandled rejection occured! Shutting down...".red);
  server.close(() => {
    process.exit(1);
  });
});

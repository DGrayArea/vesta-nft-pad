import express, { Request, Response } from "express";
import cors from "cors";
//config file for dotenv we can change any env file
import config from "./config/serverConfig";
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from "./helpers/responseHelpers";
import {
  HTTP_STATUS_CODE,
  MESSAGES,
  REQUEST_METHOD,
  // SWAGGER_OPTIONS,
} from "./common/constants";
import "module-alias/register";

//import routes
import userRoute from "./routes/userRoute";
import collectionRoute from "./routes/collectionRoute";
import listingRoute from "./routes/listingRoute";
import bidRoute from "./routes/bidRoute";
import applicationRoute from "./routes/applicationRoute";
import postRoute from "./routes/postRoute";
import commonRoute from "./routes/commonRoute";
import eventRoute from "./routes/eventRoute";
import likeRoute from "./routes/likeRoute";
import jobRoute from "./routes/jobRoute";
import transactionRoute from "./routes/transactionRoute";
import homeSettingsRoute from "./routes/homeSettingsRoute";
import taxAuthoritiesRoute from "./routes/taxAuthoritiesRoute";
import swotRoute from "./routes/swotRoutes";
import documentRoute from "./routes/documentRoute";
import subscriptionRoute from "./routes/subscriptionRoute";
import propertyRoute from "./routes/propertyRoute";
import correctionRotes from "./routes/requestCorrectionsRoutes";
import kycKybVerificationRoute from "./routes/kycKybVerificationRoute";
import systemDocsRoutes from "./routes/systemDocsRoutes";
import systemDataRoutes from "./routes/systemDataRoutes";
import downloadsRoutes from "./routes/downloadsRoute";
import errorLogsRoutes from "./routes/errorLogsRoute";

// api version 2

import { swaggerV2Spec } from "./v2/config/swaggerConfig";
import listingV2Route from "./v2/routes/marketplace/listingRoute";
import orderV2Route from "./v2/routes/marketplace/orderRoute";
import autionV2Route from "./v2/routes/marketplace/autionRoute";
import offerV2Route from "./v2/routes/marketplace/offerRoute";
import noncev2Route from "./v2/routes/marketplace/nonceRoute";
import nftV2Route from "./v2/routes/marketplace/nftRoute";

// import "./helpers/schedulers";

import swaggerUI from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";

//loggers
import expressWinston from "express-winston";
import { logger, requestLogger } from "./helpers/loggers";

// import YAML from "yamljs";
import {
  contractDeployeListener,
  contractPurchaseListener,
  contractBidAccepted,
  contractBidPlaced,
  contractBidWithdrawn,
} from "./helpers/eventListener";
import {
  addConnection,
  // getTotalConnectionsCount,
  getConnections,
  removeConnection,
  sendMessageToUser,
  // removeConnection,
} from "./helpers/utils";
import prisma from "./common/prisma-client";
import referralsRoute from "./routes/referralsRoute";
import { errors } from "./v2/middlewares/errorMiddleware";
import createNFTCollection from "./services/createCollection";
// import { orderEvent } from "./v2/events/marketplace/orderEvent";
// const swaggerJSDocs = YAML.load("./src/doc/api.yaml");
// const swaggerJSDocs = swaggerJsdoc(SWAGGER_OPTIONS);

const app = express();

app.use(cors());

//incoming Request Object as a JSON Object
app.use(express.json());

app.use("/api-v2-docs", swaggerUI.serve, swaggerUI.setup(swaggerV2Spec));

// app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));

app.get("/database", async (_, res) => {
  const metrics = await prisma.$metrics.json();
  return res.json(metrics);
});

//logger
//get request logging
app.use(
  expressWinston.logger({
    winstonInstance: requestLogger,
    statusLevels: true,
  })
);

//to debuge the body req and res
// this code ensures that the content of incoming request bodies
// and outgoing response bodies is included in the application logs.
expressWinston.requestWhitelist.push("body");
expressWinston.responseWhitelist.push("body");

// Define your route handlers
app.get("/", (req: Request, res: Response) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const date = "2/14/2024";
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      `hello ${date} base route launch pad`,
      MESSAGES.DATA_SUCCESS
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
});

app.post("/create", async (req: Request, res: Response) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }
    const {
      name,
      symbol,
      baseURI,
      maxSupply,
      owner,
      rounds,
      timestamp,
      networkish,
    } = req.body;
    const createdCollection = await createNFTCollection({
      name,
      symbol,
      baseURI,
      maxSupply,
      owner,
      rounds,
      timestamp,
      networkish,
    });

    return res.status(200).json({
      collection: createdCollection,
    });
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
});

app.get("/sse/:userAddress", (req, res) => {
  const userAddress = req.params.userAddress;

  // Set up Server-Sent Events (SSE) headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Log that a new client has connected
  console.log(`Client connected to SSE for user ${userAddress}`);

  // Add the response object to the connections for the specified user
  addConnection(userAddress, res);

  //send resposonse to the frontend

  sendMessageToUser(
    userAddress,
    "connected",
    { clientId: userAddress },
    "Connected Successfuly",
    true
  );
  //every one minute send a heartbeat to the client
  const heartbeatInterval = setInterval(() => {
    res.write(":heartbeat\n");
  }, 5000);

  // Handle client disconnection
  req.on("close", () => {
    const connections = getConnections(userAddress);
    // Log that a client has disconnected
    console.log(
      `Client disconnected from SSE for user ${userAddress}. this user total connected connections: ${connections.length}`
    );
    // Remove the connection when the client disconnects
    removeConnection(userAddress, res);
    // console.log("total sse connections :", getTotalConnectionsCount());
    clearInterval(heartbeatInterval);
  });

  // console.log("total sse connections :", getTotalConnectionsCount());
});

//other routes
app.use(`${config.apiPerfix}/`, commonRoute);
app.use(`${config.apiPerfix}/users`, userRoute);
app.use(`${config.apiPerfix}/collection`, collectionRoute);
app.use(`${config.apiPerfix}/listing`, listingRoute);
app.use(`${config.apiPerfix}/bid`, bidRoute);
app.use(`${config.apiPerfix}/application`, applicationRoute);
app.use(`${config.apiPerfix}/post`, postRoute);
app.use(`${config.apiPerfix}/event`, eventRoute);
app.use(`${config.apiPerfix}/nft-like`, likeRoute);
app.use(`${config.apiPerfix}/job`, jobRoute);
app.use(`${config.apiPerfix}/document`, documentRoute);
app.use(`${config.apiPerfix}/subscription`, subscriptionRoute);
app.use(`${config.apiPerfix}/property`, propertyRoute);
app.use(`${config.apiPerfix}/transaction`, transactionRoute);
app.use(`${config.apiPerfix}/home-settings`, homeSettingsRoute);
app.use(`${config.apiPerfix}/tax-authorities`, taxAuthoritiesRoute);
app.use(`${config.apiPerfix}/swot`, swotRoute);
app.use(`${config.apiPerfix}/referrals`, referralsRoute);
app.use(`${config.apiPerfix}/correction-requests`, correctionRotes);
app.use(`${config.apiPerfix}/kyc-kyb`, kycKybVerificationRoute);
app.use(`${config.apiPerfix}/systemDocs`, systemDocsRoutes);
app.use(`${config.apiPerfix}/system`, systemDataRoutes);
app.use(`${config.apiPerfix}/downloads`, downloadsRoutes);
app.use(`${config.apiPerfix}/logs`, errorLogsRoutes);

//api version 2

app.use(`/api/v2/listings`, listingV2Route);
app.use(`/api/v2/orders`, orderV2Route);
app.use(`/api/v2/auctions`, autionV2Route);
app.use(`/api/v2/offers`, offerV2Route);
app.use(`/api/v2/nonce`, noncev2Route);
app.use(`/api/v2/nfts`, nftV2Route);

app.use(errors);

const server = app.listen(config.port, function () {
  console.log("Server running on " + config.hostname + ":" + config.port);

  //event listner
  contractDeployeListener();

  contractPurchaseListener();

  contractBidPlaced();

  contractBidAccepted();

  contractBidWithdrawn();

  // version 2

  // orderEvent();
});

// errorLogger middleware to capture and log errors during request handling
//custom logger messages
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

server.on("error", function (error) {
  console.error("Server startup error:", error.message);
});

export default app;

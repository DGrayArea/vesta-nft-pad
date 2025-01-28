import dotenv from "dotenv";
dotenv.config();

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || "http://localhost";
const SERVER_PORT = process.env.PORT || 5000;
const JWTSECRET: any = process.env.JWTSECRET || "myjwtsecret12355";
const ENVIROMENT = process.env.ENVIROMENT || "dev";
const BACKEND_BASEURL =
  process.env.BACKEND_BASEURL || `${SERVER_HOSTNAME}:${SERVER_PORT}`;
const APIPERFIX = process.env.APIPERFIX || "/api/v1";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "6eca7e1786900a09f612af42f615a249d03fddf5c94c54a329a5b3c1ac3ae77b";
const AWS_REGION = process.env.AWS_REGION || "";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const ALCHEMY_API_KEY =
  process.env.ALCHEMY_API_KEY || "R5yARZ_ilTIGZndoATeJAtUPv5SbinxD";
const WEB_SOCKET_PROVIDER =
  process.env.WEB_SOCKET_PROVIDER ||
  "wss://mainnet.infura.io/ws/v3/34815cc4b79d43ddacef021408fc3065\n";
const JSON_RPC_PROVIDER =
  process.env.JSON_RPC_PROVIDER ||
  "https://mainnet.infura.io/v3/34815cc4b79d43ddacef021408fc3065";
const CLIENT = process.env.CLIENT_URL;


const SERVER = {
  hostname: SERVER_HOSTNAME,
  port: SERVER_PORT,
  secret: JWTSECRET,
  apiPerfix: APIPERFIX,
  enviroment: ENVIROMENT,
  s3AccessKey: S3_ACCESS_KEY,
  s3SecretKey: S3_SECRET_KEY,
  s3BucketRegion: AWS_REGION,
  s3Bucket: AWS_S3_BUCKET,
  redisURL: REDIS_URL,
  redisPassword: REDIS_PASSWORD,
  serverBrokerPrivateKey: PRIVATE_KEY,
  alchemyApiKey: ALCHEMY_API_KEY,
  backendBaseURL: BACKEND_BASEURL,
  WebSocketProvider: WEB_SOCKET_PROVIDER,
  JsonRpcProvider: JSON_RPC_PROVIDER,
  client: CLIENT,

};

export default SERVER;

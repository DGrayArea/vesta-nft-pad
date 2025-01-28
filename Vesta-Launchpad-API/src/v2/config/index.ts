import dotenv from "dotenv";
dotenv.config();

import {
  MarketPlaceContractABI,
  MarketplaceStrategyABI,
} from "@/v2/config/marketplaceConfig";

export const config = {
  api: {
    port: process.env.API_PORT ?? 5000,
  },
  swagger: {
    projectName: process.env.PROJECT_NAME ?? "Backend",
    apiBaseURL: process.env.API_BASE_URL ?? "",
  },
  web3: {
    alchemyApiKey:
      process.env.ALCHEMY_API_KEY || "R5yARZ_ilTIGZndoATeJAtUPv5SbinxD",
    websocketProvider:
      process.env.WEB_SOCKET_PROVIDER ||
      "wss://mainnet.infura.io/ws/v3/34815cc4b79d43ddacef021408fc3065\n",
    jsonRpcProvider:
      process.env.JSON_RPC_PROVIDER ||
      "https://mainnet.infura.io/v3/34815cc4b79d43ddacef021408fc3065",
  },
  marketplace: {
    address: process.env.MARKETPLACE_ADDRESS ?? "0x15255A1287e366ce8DE96e9f571B93824ef354A7",
    contractAbi: MarketPlaceContractABI,
    contractStrategyAbi: MarketplaceStrategyABI,
  },
};

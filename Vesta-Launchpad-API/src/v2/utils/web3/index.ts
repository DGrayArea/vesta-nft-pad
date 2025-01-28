import { config } from "@/v2/config";
import { ethers } from "ethers";

// Validate configuration
if (!config.web3.jsonRpcProvider) {
  throw new Error("JsonRpcProvider URL is required in configuration");
}

// if (
//   !config.marketplace.address ||
//   !ethers.isAddress(config.marketplace.address)
// ) {
//   throw new Error("Invalid or missing marketplace contract address");
// }

// if (
//   !config.marketplace.contractAbi ||
//   !Array.isArray(config.marketplace.contractAbi) ||
//   config.marketplace.contractAbi.length === 0
// ) {
//   throw new Error("Contract ABI is empty or invalid");
// }

const provider = new ethers.JsonRpcProvider(config.web3.jsonRpcProvider);
const marketplace = new ethers.Contract(
  config.marketplace.address!,
  config.marketplace.contractAbi!,
  provider
);

export { provider, marketplace };

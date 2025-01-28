import { marketplace, provider } from "@/v2/utils/web3";
import { ethers } from "ethers";

import { TListing } from "@/v2/types/marketplace/listing";
import { config } from "../config";

/**
 * Validates the signature for an order using the strategy contract.
 * @param order - The order object that contains the details of the order.
 * @param signature - The signature to validate, typically an Ethereum signature.
 * @returns A boolean indicating whether the signature is valid or not.
 * @throws Will catch and log any errors that occur during signature validation.
 */
export const validateSignature = async (order: TListing, signature: string): Promise<boolean> => {
  try {
    // Fetch the strategy contract address based on the strategyId from the order.
    const strategyAddress = await marketplace.strategies(order.strategyId);

    // Create a contract instance using the strategy address and the contract ABI.
    const strategy = new ethers.Contract(
      strategyAddress,
      config.marketplace.contractStrategyAbi,
      provider
    );

    // Use the strategy contract to validate the signature against the order
    return await strategy.validate(signature, order);
  } catch (error) {
    // Log any errors that occur during signature validation
    console.error("Signature validation failed:", error);
    // Return false if signature validation fails
    return false;
  }
};

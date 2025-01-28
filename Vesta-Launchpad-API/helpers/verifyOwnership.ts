import { ethers, Contract } from "ethers";
import { ContractABI } from "./contractABI";
import { logger } from "../helpers/loggers";
import { cloudlog } from "./cloudwatchLogger";
import config from "../config/serverConfig";

const provider = new ethers.WebSocketProvider(config.WebSocketProvider);

export async function verifyNFTOwnership(
  contractAddress: string,
  nftId: number,
  message: string,
  signature: string
) {
  try {
    // check if contract is valid or not
    // console.log(contractAddress, nftId, message, signature);
    if (!ethers.isAddress(contractAddress)) {
      return false;
    }
    const nftContract = new Contract(contractAddress, ContractABI, provider);

    //check if nft exist or not in the contract
    // const contractName = await nftContract.name();
    // const contractSymbol = await nftContract.symbol();
    cloudlog.info("nft id", nftId);
    const nftOwner = await nftContract.ownerOf(nftId);
    cloudlog.info("nftOwner", nftOwner);
    // https://docs.ethers.org/v6/api/constants/
    //https://github.com/ethers-io/ethers.js/blob/main/src.ts/constants/addresses.ts#L7
    if (nftOwner === ethers.ZeroAddress) {
      cloudlog.info("Invalid nft id");
      console.error("Invalid nft id");
      return false;
    }

    //decode the signature and verify the nft owner and the signer address
    const recoveredAddress = ethers.verifyMessage(message, signature);

    cloudlog.info("recoveredAddress : ", recoveredAddress);

    // check the NFT owner address and the signer address
    if (nftOwner.toLowerCase() === recoveredAddress.toLowerCase()) {
      cloudlog.info("NFT ownership verified.");
      return true;
    } else {
      cloudlog.info(
        "NFT ownership could not be verified. The owner does not match the signer address."
      );
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    logger.error(`Error in verifyNFTOwnership : ${error}`);
    return false;
  }
}

export async function isCheckTokenMinted(
  contractAddress: string,
  tokenId: number
) {
  try {
    // check if contract is valid or not
    if (!ethers.isAddress(contractAddress)) {
      return false;
    }
    const nftContract = new Contract(contractAddress, ContractABI, provider);

    cloudlog.info("nft id", tokenId);
    const nftOwner = await nftContract.ownerOf(tokenId);
    if (nftOwner === ethers.ZeroAddress) {
      console.error("Invalid nft id");
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Error in isCheckTokenMinted : ${error}`);
    cloudlog.info("Error in isCheckTokenMinted :", error);
    return false;
  }
}

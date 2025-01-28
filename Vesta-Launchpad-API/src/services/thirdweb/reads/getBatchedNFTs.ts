import { NFT } from "thirdweb";
import { getNFT } from "thirdweb/extensions/erc721";
import { stringify } from "thirdweb/utils";
import { PlatformChains } from "../utils/get-chains";
import { getContractByAddress } from "../utils/get-contract-by-address";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GetNFTsByRef = { tokenId: number; contractAddress: string };

type GetNFTsByRefsParams = {
  chain: PlatformChains;
  ref: GetNFTsByRef[];
};

type GetNFTsByRefsType = (params: GetNFTsByRefsParams) => Promise<NFT[]>;

const getNFTsByRefs: GetNFTsByRefsType = async ({ chain, ref }) => {
  const MAX_REQUEST_PER_SECOND = 99;

  const results: NFT[] = [];

  const delay = 1000 / MAX_REQUEST_PER_SECOND;

  for (let i = 0; i < ref.length; i++) {
    //
    const { tokenId, contractAddress } = ref[i];

    try {
      const contract = getContractByAddress({
        address: contractAddress,
        chain,
      });

      const nftData = await getNFT({
        includeOwner : true,
        contract,
        tokenId: BigInt(tokenId),
      });

      results.push(nftData);
      //
    } catch (error) {
      //
      console.error(
        `Failed to fetch NFT with tokenId ${stringify(tokenId)}:`,
        error
      );
    }

    // rate limit
    await sleep(delay);
  }

  return results;
};

export { getNFTsByRefs };

import { BaseTransactionOptions } from "thirdweb";
import {
  DirectListing,
  GetAllValidListingParams,
  getAllValidListings,
  totalListings,
} from "thirdweb/extensions/marketplace";

const generateNFTKey = (address: string, token: bigint) =>
  `${address}:${token}`;

const getIdFromSet = (set: Set<string>, token: string) =>
  set.has(token) ? token : null;

type GetDirectListedKeySetParams =
  {} & BaseTransactionOptions<GetAllValidListingParams>;

type GetDirectListedKeySetReturnType = {
  keySet: Set<string>;
  keyMap: Map<string, string>;
};

type GetDirectListedKeySetType = (
  params: GetDirectListedKeySetParams
) => Promise<GetDirectListedKeySetReturnType>;

const getDirectListedKeySet: GetDirectListedKeySetType = async ({
  contract,
}) => {
  try {
    // MARKETPLACE
    const totalCount = await totalListings({ contract });
    const batchSize = BigInt(100);

    const fetchAllListings = async (
      start = 0,
      accumulatedListings: DirectListing[] = []
    ) => {
      if (start >= totalCount) {
        return accumulatedListings;
      }

      // MARKETPLACE
      const validListings = await getAllValidListings({
        contract,
        start,
        count: batchSize,
      });

      return fetchAllListings(start + Number(batchSize), [
        ...accumulatedListings,
        ...validListings,
      ]);
    };

    const list = await fetchAllListings();

    const tokenData = list.map((listing) => ({
      key: `${listing.assetContractAddress}:${listing.tokenId}`,
      listingId: listing.id,
    }));

    const tokenSet = new Set(tokenData.map((data) => data.key));
    const tokenMap = new Map(
      tokenData.map((data) => [data.key, data.listingId + ""])
    );

    return { keySet: tokenSet, keyMap: tokenMap };
  } catch (error) {
    console.error("Error fetching listings of marketplace:", error);
    return { keySet: new Set(), keyMap: new Map() };
  }
};

export { generateNFTKey, getDirectListedKeySet, getIdFromSet };

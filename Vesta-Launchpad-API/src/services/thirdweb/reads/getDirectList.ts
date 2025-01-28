import { BaseTransactionOptions } from "thirdweb";
import {
  DirectListing,
  GetAllValidListingParams,
  getAllValidListings,
  totalListings,
} from "thirdweb/extensions/marketplace";

type GetDirectListParams =
  {} & BaseTransactionOptions<GetAllValidListingParams>;

type GetDirectListType = (
  params: GetDirectListParams
) => Promise<DirectListing[]>;

const getDirectList: GetDirectListType = async ({ contract }) => {
  const totalCount = await totalListings({ contract });
  const batchSize = BigInt(100);

  const fetchAllListings = async (
    start = 0,
    accumulatedListings: DirectListing[] = []
  ) => {
    if (start >= totalCount) {
      return accumulatedListings;
    }

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

  return await fetchAllListings();
};

export { getDirectList };

import { prepareContractCall, sendAndConfirmTransaction } from "thirdweb";
import { thirdWebAccount } from "../utils/admin-account";

import type { PrepareContractCallOptions } from "thirdweb";

type SetTotalSupplyParams = {
  maxSupply: bigint;
} & Omit<PrepareContractCallOptions, "method" | "params">;

type SetTotalSupplyType = (params: SetTotalSupplyParams) => Promise<void>;

const setTotalSupply: SetTotalSupplyType = async ({ maxSupply, contract }) => {
  //
  const transaction = prepareContractCall({
    contract,
    method: "function setMaxTotalSupply(uint256 _maxTotalSupply)",
    params: [maxSupply],
  });

  try {
    await sendAndConfirmTransaction({
      transaction,
      account: thirdWebAccount,
    });
  } catch (error) {
    console.log(`setMaxTotalSupply error | ${error}`);
    //
    throw error;
  }
};

export { setTotalSupply };

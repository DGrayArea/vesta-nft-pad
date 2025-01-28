import { sendAndConfirmTransaction } from "thirdweb";
import { setApprovalForAll } from "thirdweb/extensions/erc721";
import { thirdWebAccount } from "../utils/admin-account";

import type { BaseTransactionOptions } from "thirdweb";
import type { SetApprovalForAllParams } from "thirdweb/extensions/erc721";

type doSetApprovalAllParams = {
  market: string;
} & BaseTransactionOptions<
  Omit<SetApprovalForAllParams, "operator" | "approved">
>;

type doSetApprovalAllType = (params: doSetApprovalAllParams) => Promise<void>;

const doSetApprovalAll: doSetApprovalAllType = async ({ contract, market }) => {
  //
  const transaction = setApprovalForAll({
    contract,
    approved: true,
    operator: market,
  });

  //
  try {
    await sendAndConfirmTransaction({ transaction, account: thirdWebAccount });
  } catch (error) {
    // console.log(`setApprovalForAll error | ${error}`);
    //
    throw error;
  }
};

export { doSetApprovalAll };

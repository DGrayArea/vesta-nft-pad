import { sendAndConfirmTransaction } from "thirdweb";
import { setClaimConditions } from "thirdweb/extensions/erc721";
import { thirdWebAccount } from "../utils/admin-account";

import type { BaseTransactionOptions } from "thirdweb";
import type { SetClaimConditionsParams } from "thirdweb/extensions/erc721";

type OverrideEntry = {
  address: string;
  maxClaimable?: string;
  price?: string;
  currencyAddress?: string;
};

type doSetClaimsParams = {} & BaseTransactionOptions<SetClaimConditionsParams>;

type doSetClaimsType = (params: doSetClaimsParams) => Promise<void>;

const doSetClaims: doSetClaimsType = async ({
  contract,
  phases,
  resetClaimEligibility = true,
}) => {
  //
  const transaction = setClaimConditions({
    contract,
    phases,
    resetClaimEligibility,
  });

  //
  try {
    await sendAndConfirmTransaction({
      transaction,
      account: thirdWebAccount,
    });
  } catch (error) {
    console.log(`setClaimConditions error | ${error}`);
    //
    throw error;
  }
};

type ClaimConditions = SetClaimConditionsParams["phases"];

export { doSetClaims };
export type { ClaimConditions, OverrideEntry };

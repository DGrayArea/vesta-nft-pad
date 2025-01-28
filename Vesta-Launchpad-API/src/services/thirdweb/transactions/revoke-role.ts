import { sendAndConfirmTransaction } from "thirdweb";
import { revokeRole } from "thirdweb/extensions/permissions";
import { thirdWebAccount } from "../utils/admin-account";

import type { BaseTransactionOptions } from "thirdweb";
import type { RevokeRoleParams } from "thirdweb/extensions/permissions";

type DoRevokeRoleParams = {} & BaseTransactionOptions<RevokeRoleParams>;

type DoRevokeRoleType = (params: DoRevokeRoleParams) => Promise<void>;

const doRevokeRole: DoRevokeRoleType = async ({
  contract,
  role,
  targetAccountAddress,
}) => {
  //
  const transaction = revokeRole({
    contract,
    role,
    targetAccountAddress,
  });

  //
  try {
    await sendAndConfirmTransaction({ transaction, account: thirdWebAccount });
  } catch (error) {
    // console.log(`revoke role error | ${error}`);
    //
    throw error;
  }
};

export { doRevokeRole };

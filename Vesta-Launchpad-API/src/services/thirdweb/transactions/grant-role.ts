import { sendAndConfirmTransaction } from "thirdweb";
import { grantRole } from "thirdweb/extensions/permissions";
import { thirdWebAccount } from "../utils/admin-account";

import type { BaseTransactionOptions } from "thirdweb";
import type { GrantRoleParams } from "thirdweb/extensions/permissions";

type DoGrantRoleParams = {} & BaseTransactionOptions<GrantRoleParams>;

type DoGrantRoleType = (params: DoGrantRoleParams) => Promise<void>;

const doGrantRole: DoGrantRoleType = async ({
  contract,
  role,
  targetAccountAddress,
}) => {
  //
  const transaction = grantRole({
    contract,
    role,
    targetAccountAddress,
  });

  //
  try {
    await sendAndConfirmTransaction({ transaction, account: thirdWebAccount });
  } catch (error) {
    //
    throw error;
  }
};

export { doGrantRole };

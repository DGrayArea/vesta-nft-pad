import { sendAndConfirmTransaction } from "thirdweb";
import { lazyMint } from "thirdweb/extensions/erc721";
import { thirdWebAccount } from "../utils/admin-account";

import type { BaseTransactionOptions } from "thirdweb";
import type { LazyMintParams } from "thirdweb/extensions/erc721";

type LazyMintToParams = BaseTransactionOptions<LazyMintParams>;

type LazyMintToType = (params: LazyMintToParams) => Promise<void>;

const lazyMintTo: LazyMintToType = async ({ contract, nfts }) => {
  const transaction = lazyMint({
    contract,
    nfts,
  });

  try {
    // get the hash log if needed
    await sendAndConfirmTransaction({ transaction, account: thirdWebAccount });
  } catch (error) {
    // console.log(`lazyMint error | ${error}`);
    throw error;
  }
};

export { lazyMintTo };

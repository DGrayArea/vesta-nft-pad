import { Interface } from "ethers";
import { eth_getTransactionByHash, getRpcClient } from "thirdweb";

import { PlatformChains, platformChains } from "../utils/get-chains";
import { thirdwebClient } from "../utils/thirdwebClient";
import { ERC721ABI } from "../abi/erc721-abi";

type VerifyClaimParams = {
  tx: `0x${string}`;
  chain: PlatformChains;
};

type Transaction = Awaited<ReturnType<typeof eth_getTransactionByHash>>;

type VerifyClaimReturnType = {
  transaction: Transaction;
  method: string;
  claimer: string;
  quantity: string;
};

type VerifyClaimType = (
  params: VerifyClaimParams
) => Promise<VerifyClaimReturnType>;

const verifyClaim: VerifyClaimType = async ({ tx, chain }) => {
  //
  const mappedChain = platformChains[chain];

  //
  const rpcRequest = getRpcClient({
    client: thirdwebClient,
    chain: mappedChain,
  });

  //
  const transaction = await eth_getTransactionByHash(rpcRequest, {
    hash: tx,
  });

  //
  const abi = ERC721ABI;
  const iface = new Interface(abi);

  const decoded = iface.parseTransaction({ data: transaction.input });

  const method = decoded?.name || "unknown";
  const claimer = decoded?.["args"]?.[0] || "unknown";
  const quantityClaimed = decoded?.["args"]?.[1] || "0";

  return {
    transaction,
    claimer,
    method,
    quantity: quantityClaimed,
  };
};

export { verifyClaim };

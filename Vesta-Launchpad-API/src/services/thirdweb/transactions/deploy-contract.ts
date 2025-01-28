import { deployERC721Contract } from "thirdweb/deploys";
import { thirdWebAccount } from "../utils/admin-account";
import { platformChains } from "../utils/get-chains";
import { thirdwebClient } from "../utils/thirdwebClient";

import type { DeployERC721ContractOptions } from "thirdweb/deploys";
import type { PlatformChains } from "../utils/get-chains";

type DeployCollectionContractParams = {
  chain: PlatformChains;
} & Pick<DeployERC721ContractOptions, "params"> &
  Partial<Omit<DeployERC721ContractOptions, "chain" | "params">>;

type DeployCollectionContractType = (
  params: DeployCollectionContractParams
) => Promise<string>;

const deployCollectionContract: DeployCollectionContractType = async ({
  chain,
  params,
  account = thirdWebAccount,
  client = thirdwebClient,
  type = "DropERC721",
}) => {
  //
  const mappedChain = platformChains[chain];

  try {
    const contractAddress = await deployERC721Contract({
      chain: mappedChain,
      client,
      account,
      type,
      params,
    });

    return contractAddress;

    //
  } catch (error) {
    //
    throw error;
  }
};

export { deployCollectionContract };

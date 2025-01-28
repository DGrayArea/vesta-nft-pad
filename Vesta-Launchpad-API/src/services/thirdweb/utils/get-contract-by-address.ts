import { getContract } from "thirdweb";
import { platformChains } from "./get-chains";
import { thirdwebClient } from "./thirdwebClient";

import type { ContractOptions, ThirdwebClient } from "thirdweb";
import type { PlatformChains } from "./get-chains";

type GetContractByAddressParams = {
  client?: ThirdwebClient;
  chain: PlatformChains;
} & Pick<ContractOptions, "abi" | "address">;

type GetContractByAddressType = (
  params: GetContractByAddressParams
) => Readonly<ContractOptions<[]>>;

const getContractByAddress: GetContractByAddressType = ({
  address,
  chain,
  client = thirdwebClient,
}) => {
  //
  const mappedChain = platformChains[chain];

  try {
    const contract = getContract({
      client,
      address,
      chain: mappedChain,
    });

    return contract;
    //
  } catch (error) {
    console.log(`getContract error | ${error}`);
    //
    throw error;
  }
};

export { getContractByAddress };

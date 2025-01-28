import { baseSepolia, ethereum, polygon } from "thirdweb/chains";

const platformChains = {
  ETHEREUM: ethereum,
  POLYGON: polygon,
  BASESEPOLIA: baseSepolia,
} as const;

const platformChainsByIds = {
  1: "ETHEREUM",
  137: "POLYGON",
  84532: "BASESEPOLIA",
} as const;

type PlatformChains = keyof typeof platformChains;

export { platformChains, platformChainsByIds };
export type { PlatformChains };

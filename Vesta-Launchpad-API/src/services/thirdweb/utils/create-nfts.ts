import { NFTInput } from "thirdweb/dist/types/utils/nft/parseNft";

type NFTMetaExtension = {
  contractAddress: string;
  contractName: string;
  contractLogo: string;
  contractOwnerImg?: string;

  royaltyBps?: number;
  platformFeeBps?: number;

  category?: string;
  chain?: number;
};

type CreateNFTsParams = {
  count: number;
} & NFTInput &
  NFTMetaExtension;

type CreateNFTsType = (params: CreateNFTsParams) => NFTInput[];

const createNFTs: CreateNFTsType = ({ count, name, ...rest }) => {
  return Array.from({ length: count }, (_, index) => ({
    name: `${name} #${index + 1}`,
    description: rest?.description,
    image: rest?.image,
    // image: `https://example.com/image${index + 1}.png`,

    animation_url: rest?.animation_url || undefined,
    external_url: rest?.external_url || undefined,
    background_color: rest?.background_color || undefined,
    properties: rest?.properties || undefined,

    contractAddress: rest?.contractAddress || undefined,
    contractName: rest?.contractName || undefined,
    contractLogo: rest?.contractLogo || undefined,
    contractOwnerImg: rest?.contractOwnerImg || undefined,

    royaltyBps: rest?.royaltyBps || undefined,
    platformFeeBps: rest?.platformFeeBps || undefined,

    category: rest?.category || undefined,
    chain: rest?.chain || undefined,
  }));
};

export { createNFTs };

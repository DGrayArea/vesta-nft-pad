export type TNFTMetadata = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<any>;
};

export type TListingStatus = "active" | "sold" | "cancelled";

export type TListing = {
  id: string;
  maker: string;
  nftContract: string;
  tokenId: number;
  quantity: number;
  price: number;
  status: TListingStatus;
  paymentToken: string;
  strategyId: string;
  params: any;
  createdAt: Date;
  updatedAt: Date;
};

export type TListingCreateInput = {
  nftContract: string;
  orderHash: string;
  taker: string;
  signature: string;
  nonce: any;
  tokenId: number;
  expiry: string;
  maker: string;
  quantity: number;
  price: string;
  paymentToken: string;
  strategyId: string;
  params?: string;
  metadata?: TNFTMetadata;
};

export type TListingFilters = {
  maker?: string;
  nftContract?: string;
  tokenId?: string;
  status?: TListingStatus;
  strategyId?: string;
  minPrice?: string;
  maxPrice?: string;
  page: number;
  limit: number;
};

export type TRequestListing = Request & {
  jwt?: {
    id: string;
  };
  bod: TListingCreateInput;
};

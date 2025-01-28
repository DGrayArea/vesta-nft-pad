export interface TOfferCreateInput {
  nftContract: string;
  tokenId: number;
  quantity: number;
  price: string;
  paymentToken: string;
  expiry: number;
  offerer: string;
}

export interface TCounterOfferInput {
  price: string;
  expiry: number;
  offerer: string;
}

export interface TOffer {
  id?: string;
  offerId: string;
  offerer: string;
  nftContract: string;
  tokenId: number;
  quantity: number;
  price: string;
  paymentToken: string;
  expiry: Date;
  nonce: number;
  isCounterOffer: boolean;
  originalOfferId?: string;
  cancelled: boolean;
  executed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TOfferFilters = {
  offerId?: string;
  maker?: string;
  nftContract?: string;
  tokenId?: string;
  strategyId?: string;
  minPrice?: string;
  maxPrice?: string;
  page: number;
  limit: number;
};

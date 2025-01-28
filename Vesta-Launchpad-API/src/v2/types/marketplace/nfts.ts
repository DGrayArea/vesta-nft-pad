// Define the NFT type
export type TNft = {
  tokenId: string;
  metadata: any;
  listing?: TListing | null;
};

// Define the Listing type
export type TListing = {
  tokenId: string;
  nftContract: string;
  status: string; // "active" | "sold" | "cancel"
};

// Define Filters type
export type TNftFilters = {
  page?: number;
  limit?: number;
  status?: any;
};

// Define Pagination type
export type TPagination = {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
};

// Define the service response type
export type TNftServiceResponse = {
  collection: any;
  nfts: any[];
  pagination: TPagination;
};

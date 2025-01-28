import { TListing } from "./listing";

export type TOrder = {
  id: string;                     
  transactionHash?: string;      
  orderHash: string;
  maker: string;
  taker?: string;
  expiry: Date;
  nonce: number;
  signature: string;
  status: TOrderStatus;
  
  createdAt: Date;                
  updatedAt: Date;                
  // Relations
  listing: TListing;  
};
export type TOrderStatus = "pending" | "executed" | "cancelled";

export type TOrderFilters = {
  maker?: string;
  taker?: string;
  status?: TOrderStatus;
  page?: number;
  limit?: number;
};

export type TPaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

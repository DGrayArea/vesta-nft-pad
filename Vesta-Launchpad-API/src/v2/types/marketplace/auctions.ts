// Type for creating a new auction
export type TAuctionCreateInput = {
  auctionId: string;            
  seller: string;                
  startTime: Date;              
  endTime: Date;                 
  minBidIncrement: string;      
  reservePrice: string;          
  paymentToken: string;         
  nftContract: string;          
  tokenId: number;               
  quantity: number;            
};

// Type for filters when retrieving auctions
export type TAuctionFilters = {
  seller?: string;               
  nftContract?: string;        
  tokenId?: number;             
  page: number;
  limit: number;         
};


// Type for placing a bid on an auction
export type TBidInput = {
  bidder: string;                // Bidder's address
  amount: string;                // Bid amount in wei
};

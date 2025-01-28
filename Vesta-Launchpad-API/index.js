const { Alchemy, Network } = require("alchemy-sdk");
const { createClient } = require("redis");
require("dotenv").config();
let client;

(async () => {
  // Initialize Redis client
  const REDIS_URL = process.env.REDIS_URL;
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
  const REDIS_PORT = 6379;
  try {
    client = createClient({
      url: REDIS_URL,
      password: REDIS_PASSWORD,
    });
    client.on("error", (error) => console.error(`Error : ${error}`));
    await client.connect();
  } catch (error) {
    console.log("Couldn't connect to Redis");
  }
})();

const config = {
  apiKey: "U8csORD34phwrAoHhahDnKy3fa4BIUZ0",
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(config);

const getOwnersCount = async (contractAddress) => {
  try {
    const cacheKey = `nfts-${contractAddress}`;
    const cachedNFTs = await client.get(cacheKey);

    // Check if cache is expired
    const cacheExpirationTime = await client.ttl(cacheKey);
    const isCacheExpired =
      cacheExpirationTime === -2 || cacheExpirationTime <= 0;

    if (cachedNFTs || !isCacheExpired) {
      // Return cached NFTs if valid
      console.log("Fetched NFTs from Redis cache", cachedNFTs);
      return JSON.parse(cachedNFTs);
    }

    const getOwnersCount = await alchemy.nft.getOwnersForContract(
      contractAddress
    );
    const ownersCount = getOwnersCount.owners.length;
    console.log("Owners count: ", ownersCount);

    // Store data in cache
    await client.set(cacheKey, JSON.stringify(ownersCount), {
      EX: 300, // Cache for 5 minutes
    });

    return ownersCount;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const omitMetadata = false;
const getNFTsForContract = async (address) => {
  try {
    let pageKey = null;
    let page = 0;
    const allNFTs = [];
    // Check Redis cache for NFT data
    const cacheKey = `nfts-${address}`;
    const cachedNFTs = await client.get(cacheKey);
    // Check if cache is expired
    const cacheExpirationTime = await client.ttl(cacheKey);
    const isCacheExpired = cacheExpirationTime <= 0;
    if (cachedNFTs && !isCacheExpired) {
      console.info("Fetched NFTs from Redis cache");
      return JSON.parse(cachedNFTs);
    }
    console.info("Making API call to Alchemy...");
    do {
      const response = await alchemy.nft.getNftsForContract(address, {
        omitMetadata,
        pageKey,
        tokenUriTimeoutInMs: 300 * 1000,
      });
      const filteredNFTs = response.nfts?.map((nft) => {
        let imageUrl;
        if (
          (nft?.rawMetadata?.image &&
            nft?.rawMetadata?.image.startsWith("ipfs://")) ||
          (nft?.image?.originalUrl &&
            nft?.image?.originalUrl.startsWith("ipfs://"))
        ) {
          const ipfsHash =
            nft?.image?.originalUrl.replace("ipfs://", "") ||
            nft?.rawMetadata?.image.replace("ipfs://", "");
          imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        } else {
          imageUrl = nft?.image?.originalUrl || nft?.rawMetadata?.image || "";
        }
        return {
          name: nft?.contract?.name || nft?.name || "",
          symbol: nft?.contract?.symbol || "",
          floorPrice:
            nft?.contract?.openSea?.floorPrice ||
            nft?.contract?.openSeaMetadata?.floorPrice ||
            null,
          contractAddress: nft?.contract?.address || null,
          tokenId: nft?.tokenId || null,
          tokenType: nft?.tokenType || "",
          title: nft?.name || "",
          description: nft?.description || "",
          timeLastUpdated: nft?.timeLastUpdated || null,
          image: imageUrl,
          attributes:
            nft?.raw?.metadata?.attributes ||
            nft?.rawMetadata?.attributes ||
            null,
        };
      });
      allNFTs.push(...filteredNFTs);
      console.info(`Total NFTs: ${allNFTs.length}`);
      console.info(`Current Page : ${(page += 1)}`);
      pageKey = response.pageKey;
    } while (pageKey);
    console.info("Caching data for 5 minutes...");
    await client.set(cacheKey, JSON.stringify(allNFTs), {
      EX: 300, // Cache for 5 minutes
    });
    return allNFTs;
  } catch (error) {
    console.error(error);
    return [];
  }
};
getOwnersCount("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d");

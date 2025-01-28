import { Alchemy, Network } from "alchemy-sdk";
import { createClient } from "redis";
import configs from "../../config/serverConfig";
import { cloudlog } from "@/helpers/cloudwatchLogger";
import { logger } from "@/helpers/loggers";

// Redis connection details
// const redisHost = "localhost";
// const redisPort = 6379;

let client;

(async () => {
  // Initialize Redis client
  try {
    client = createClient({
      url: configs.redisURL,
      password: configs.redisPassword,
    });

    client.on("error", (error) => console.error(`redis error : ${error}`));

    await client.connect();

    cloudlog.info("Connected to Redis");
  } catch (error) {
    cloudlog.info("Coudnt connect to redis");
  }
})();

// TODO : CHAIN SWITCHER
// PROD : USE BASE_SEP for now
const config = {
  apiKey: configs.alchemyApiKey,
  network: Network.ETH_SEPOLIA,

  // configs.enviroment.toLocaleLowerCase() === "dev"
  // ? Network.BASE_SEPOLIA
  // : Network.ETH_MAINNET,
};
const omitMetadata = false;

const alchemy = new Alchemy(config);

export const getNFTsForContract = async (address: string): Promise<any[]> => {
  try {
    // Proceed with Redis operations
    let pageKey: any = null;
    let page: number = 0;
    const allNFTs: any[] = [];

    // Check Redis cache for NFT data
    const cacheKey = `nfts-${address}`;
    const cachedNFTs = await client.get(cacheKey);

    // Check if cache is expired
    const cacheExpirationTime = await client.ttl(cacheKey);
    const isCacheExpired =
      cacheExpirationTime === -2 || cacheExpirationTime <= 0;

    if (cachedNFTs || !isCacheExpired) {
      // Return cached NFTs if valid
      cloudlog.info("Fetched NFTs from Redis cache");
      return JSON.parse(cachedNFTs!);
    }
    // Make API call if no cached data
    cloudlog.info("Making API call to Alchemy...");

    do {
      const response = await alchemy.nft.getNftsForContract(address, {
        omitMetadata,
        pageKey,
        tokenUriTimeoutInMs: 300 * 1000,
      });

      // Filter the NFTs data to get only the desired data
      const filteredNFTs: any[] = response.nfts?.map((nft: any) => {
        let imageUrl: string;
        if (
          (nft?.rawMetadata?.image &&
            nft?.rawMetadata?.image.startsWith("ipfs://")) ||
          (nft?.image?.originalUrl &&
            nft?.image?.originalUrl.startsWith("ipfs://"))
        ) {
          // Handle IPFS image URL
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

      cloudlog.info(`Total NFTs: ${allNFTs.length}`);
      cloudlog.info(`Current Page : ${(page += 1)}`);
      // console.log(`Page Key  : ${pageKey}`);
      pageKey = response.pageKey;
    } while (pageKey);

    // console.log(`Total NFTs: ${allNFTs.length}`);

    // Cache data for 5 minutes
    cloudlog.info("Caching data for 5 minutes...");
    // Process and cache the NFTs data
    // await client.set(cacheKey, JSON.stringify(allNFTs), {
    //   EX: 30, // Cache for 5 minutes
    // });
    return allNFTs;
  } catch (error) {
    logger.error(error);
    return [];
  }
};

export const getNFTsForOwner = async (
  accountAddress: string,
  contracts: []
): Promise<any[]> => {
  try {
    // Proceed with Redis operations
    let pageKey: any = null;
    let page: number = 0;
    const allNFTs: any[] = [];

    // Check Redis cache for NFT data
    const cacheKey = `account-nfts-${accountAddress}-${contracts}`;
    const cachedNFTs = await client.get(cacheKey);

    // Check if cache is expired
    const cacheExpirationTime = await client.ttl(cacheKey);
    const isCacheExpired =
      cacheExpirationTime === -2 || cacheExpirationTime <= 0;

    cloudlog.info("Checking cached data...");

    if (cachedNFTs || !isCacheExpired) {
      // Return cached NFTs if valid
      cloudlog.info("Fetched NFTs from Redis cache");
      return JSON.parse(cachedNFTs!);
    }
    // Make API call if no cached data
    cloudlog.info("Making API call to Alchemy...");

    do {
      const response = await alchemy.nft.getNftsForOwner(accountAddress, {
        omitMetadata,
        contractAddresses: contracts,
        pageKey,
        tokenUriTimeoutInMs: 300 * 1000,
      });

      // Filter the NFTs data to get only the desired data
      const filteredNFTs: any[] = response?.ownedNfts?.map((nft: any) => {
        let imageUrl: string;
        if (
          (nft?.rawMetadata?.image &&
            nft?.rawMetadata?.image.startsWith("ipfs://")) ||
          (nft?.image?.originalUrl &&
            nft?.image?.originalUrl.startsWith("ipfs://"))
        ) {
          // Handle IPFS image URL
          const ipfsHash =
            nft?.image?.originalUrl.replace("ipfs://", "") ||
            nft?.rawMetadata?.image.replace("ipfs://", "");
          imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        } else {
          imageUrl = nft?.image?.originalUrl || nft?.rawMetadata?.image || "";
        }

        return {
          name: nft?.contract?.name || "",
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
          contractLogo: nft?.raw?.metadata?.contractLogo,
          attributes:
            nft?.raw?.metadata?.attributes ||
            nft?.rawMetadata?.attributes ||
            null,
        };
      });

      allNFTs.push(...filteredNFTs);

      cloudlog.info(`Total NFTs: ${allNFTs.length}`);
      cloudlog.info(`Current Page : ${(page += 1)}`);
      // console.log(`Page Key  : ${pageKey}`);
      pageKey = response.pageKey;
    } while (pageKey);

    // console.log(`Total NFTs: ${allNFTs.length}`);

    // Cache data for 5 minutes
    cloudlog.info("Caching data for 5 minutes...");
    // Process and cache the NFTs data
    await client.set(cacheKey, JSON.stringify(allNFTs), {
      EX: 300, // Cache for 5 minutes
    });
    return allNFTs;
  } catch (error) {
    logger.error(error);
    return [];
  }
};

export const getNFTByTokenId = async (
  contractAddress: string,
  tokenId: number
): Promise<any> => {
  try {
    const nft: any = await alchemy.nft.getNftMetadata(
      contractAddress,
      tokenId,
      {
        tokenUriTimeoutInMs: 300 * 1000,
      }
    );
    let imageUrl: string;
    if (
      (nft?.rawMetadata?.image &&
        nft?.rawMetadata?.image.startsWith("ipfs://")) ||
      (nft?.image?.originalUrl && nft?.image?.originalUrl.startsWith("ipfs://"))
    ) {
      // Handle IPFS image URL
      const ipfsHash =
        nft?.image?.originalUrl.replace("ipfs://", "") ||
        nft?.rawMetadata?.image.replace("ipfs://", "");
      imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    } else {
      imageUrl = nft?.image?.originalUrl || nft?.rawMetadata?.image || "";
    }
    const nftData: any = {
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
        nft?.raw?.metadata?.attributes || nft?.rawMetadata?.attributes || null,
    };
    return nftData;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getCollectionUniqueOwnersCount = async (address: string) => {
  try {
    const getOwnersCount = await alchemy.nft.getOwnersForContract(address);
    return getOwnersCount.owners.length;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getNFTsForOwnerBulk = async (
  contractAddresses: string[], 
  nftKeys: string[] = []
): Promise<any[]> => {
  try {
    // Logging for debug
    cloudlog.info("Contract Addresses:", contractAddresses);
    cloudlog.info("NFT Keys:", nftKeys);

    // Proceed with Redis operations
    let allNFTs: any[] = [];

    // Check Redis cache for NFT data
    const cacheKey = `account-nfts-bulk-${contractAddresses.join(
      "-"
    )}-${nftKeys.join("-")}`;
    const cachedNFTs = await client.get(cacheKey);

    // Check if cache is expired
    const cacheExpirationTime = await client.ttl(cacheKey);
    const isCacheExpired =
      cacheExpirationTime === -2 || cacheExpirationTime <= 0;

    cloudlog.info("Checking cached data...");

    if (cachedNFTs && !isCacheExpired) {
      // Return cached NFTs if valid
      cloudlog.info("Fetched NFTs from Redis cache");
      return JSON.parse(cachedNFTs);
    }

    // Fetch NFTs for each contract address
    cloudlog.info("Making API call to Alchemy...");
    for (const contractAddress of contractAddresses) {
      let pageKey: any = null;
      let page: number = 0;
      const contractNFTs: any[] = [];

      do {
        const response = await alchemy.nft.getNftsForContract(contractAddress, {
          pageKey,
          omitMetadata: false,
          tokenUriTimeoutInMs: 300 * 1000,
        });

        // Filter the NFTs data to get only the desired data
        const filteredNFTs: any[] = response?.nfts?.map((nft: any) => {
          let imageUrl: string;
          if (
            (nft?.rawMetadata?.image &&
              nft?.rawMetadata?.image.startsWith("ipfs://")) ||
            (nft?.image?.originalUrl &&
              nft?.image?.originalUrl.startsWith("ipfs://"))
          ) {
            // Handle IPFS image URL
            const ipfsHash =
              nft?.image?.originalUrl.replace("ipfs://", "") ||
              nft?.rawMetadata?.image.replace("ipfs://", "");
            imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
          } else {
            imageUrl = nft?.image?.originalUrl || nft?.rawMetadata?.image || "";
          }

          // If specific NFT keys are provided, filter accordingly
          if (nftKeys.length > 0) {
            const nftKey = `${contractAddress}-${nft.tokenId}`;
            if (!nftKeys.includes(nftKey)) return null;
          }

          return {
            name: nft?.contract?.name || "",
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
            contractLogo: nft?.rawMetadata?.contractLogo,
            attributes:
              nft?.rawMetadata?.attributes ||
              nft?.contract?.attributes ||
              null,
          };
        }).filter(nft => nft !== null); // Remove null entries

        contractNFTs.push(...filteredNFTs);

        cloudlog.info(`Total NFTs for ${contractAddress}: ${contractNFTs.length}`);
        cloudlog.info(`Current Page for ${contractAddress}: ${++page}`);
        pageKey = response.pageKey;
      } while (pageKey);

      // Merge the NFTs for all contract addresses
      allNFTs.push(...contractNFTs);
    }

    // Cache data for 5 minutes
    cloudlog.info("Caching bulk NFT data for 5 minutes...");
    await client.set(cacheKey, JSON.stringify(allNFTs), {
      EX: 300, // Cache for 5 minutes
    });

    cloudlog.info("Total NFTs found:", allNFTs.length);
    return allNFTs;
  } catch (error) {
    logger.error("Error in getNFTsForOwnerBulk:", error);
    return [];
  }
};

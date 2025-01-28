import { ethers } from "ethers";
// import { keccak256 } from "ethers/lib/utils";
// import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import serverConfig from "../config/serverConfig";

interface RoundParams {
  startTime: number;
  endTime: number;
  price: number;
  maxSupply: number;
  merkleRoot: string;
  isWhitelistEnabled: boolean;
}

interface CreationType {
  name: string;
  symbol: string;
  baseURI: string;
  maxSupply: number;
  owner: string;
  rounds: RoundParams[];
  timestamp: number;
  networkish?: string;
}

const contractAddress = "0x25c3A1da00d7f017C3Ad472BBed7EF533d96ac34";
const ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "AccessControlBadConfirmation", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "neededRole", type: "bytes32" },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      {
        indexed: false,
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxSupply",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "roundCount",
        type: "uint256",
      },
    ],
    name: "CollectionDeployed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "ADMIN_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEPLOYER_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "baseURI", type: "string" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
    ],
    name: "computeAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "baseURI", type: "string" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      {
        components: [
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "maxSupply", type: "uint256" },
          { internalType: "bytes32", name: "merkleRoot", type: "bytes32" },
          { internalType: "bool", name: "isWhitelistEnabled", type: "bool" },
        ],
        internalType: "struct RoundParams[]",
        name: "rounds",
        type: "tuple[]",
      },
    ],
    name: "deployCollectionWithRounds",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleAdmin",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "callerConfirmation", type: "address" },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

// Function to generate the Merkle root
// function generateMerkleRoot(addresses: typeof addresses): string {
//     const tree = StandardMerkleTree.of(addresses, ["address", "uint256"]);
//     const root = tree.root;
//     return root;
//   }

function generateSalt(name: string, owner: string, timestamp: number): string {
  const saltData = ethers.utils.solidityKeccak256(
    ["string", "address", "uint256"],
    [name, owner, timestamp]
  );
  return saltData;
}

const createNFTCollection = async ({
  name,
  symbol,
  baseURI,
  maxSupply,
  owner,
  rounds,
  timestamp,
  networkish,
}: CreationType) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      serverConfig.JsonRpcProvider,
      networkish ?? "sepolia"
    );
    const signer = new ethers.Wallet(
      serverConfig.serverBrokerPrivateKey,
      provider
    );
    /**
           * @dev enters params to pass to create function with correct data types for @entity nft collection
             @name (string)
             @symbol (string)
             @baseURI (string)
             @maxSupply (uint256)
             @salt (bytes32)
             @owner (string)
             @rounds (tuple[])
    */
    const formattedSalt = generateSalt(name, owner, timestamp);

    const contract = new ethers.Contract(contractAddress, ABI, signer);

    const tx = await contract.deployCollectionWithRounds(
      name,
      symbol,
      baseURI,
      maxSupply,
      owner,
      formattedSalt,
      rounds
    );
    const receipt = await tx.wait(2);
    return receipt;
  } catch (error) {
    console.error("Error deploying NFT collection:", error);
    throw error;
  }
};

export default createNFTCollection;

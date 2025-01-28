import { prepareEvent } from "thirdweb";

const CLAIM_EVENT = "TokensClaimed" as const;

const claimEvent = prepareEvent({
  signature:
    "event TokensClaimed(uint256 indexed claimConditionIndex, address indexed claimer, address indexed receiver, uint256 startTokenId, uint256 quantityClaimed)",
});

export { CLAIM_EVENT, claimEvent };

import { privateKeyToAccount } from "thirdweb/wallets";
import { thirdwebClient } from "./thirdwebClient";

const account = privateKeyToAccount({
  client: thirdwebClient,
  privateKey: process.env.AUTH_PRIVATE_KEY!,
});

export { account as thirdWebAccount };

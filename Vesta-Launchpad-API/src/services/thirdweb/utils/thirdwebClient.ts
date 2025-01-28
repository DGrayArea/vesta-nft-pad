import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY!;

const thirdwebClient = createThirdwebClient({ secretKey });

export { thirdwebClient };
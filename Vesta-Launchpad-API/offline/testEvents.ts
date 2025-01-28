import { config } from "dotenv";
config();
import {
//   getContractDeployEventLogs,
  testTransactionReciept,
} from "../src/helpers/eventLogs";
// import { cloudlog } from "../src/helpers/cloudwatchLogger";
// async function main() {
//   const eventLogs = await getContractDeployEventLogs(
//     "0x8c7979dd351f594ad070ef8d2a6bdfff3afabdda41af46871a27c61e00f863ec"
//   );
//   cloudlog.debug(JSON.stringify(eventLogs));
//   cloudlog.error("Hello world");
// }

async function testReceipts(txHash: string) {
  console.log("receipt logs>>> ",testTransactionReciept(txHash));
}

testReceipts(
  "0x2985084832a4bf47929163e33ca0b38cb77df5c19eb075ce3135d2148cfb6ea8"
);

import {Response } from "express";

import prisma from "../common/prisma-client";

// Map to store user connections
const userConnections = new Map<string, Response>();

// Function to send updates to a specific user
function sendUserUpdate(userAddress: string, event: string, data: string) {
  const userConnection = userConnections.get(userAddress);
  if (userConnection) {
    userConnection.write(`event: ${event}\n`);
    userConnection.write(`data: ${data}\n\n`);
  }
}

export const getBidRealTimeMessages = async (req, res, _) => {
  try {
    const { userAddress } = req.params;
    userConnections.set(userAddress, res);
    const activeBids: any = await prisma.bid.findMany({
      where: {
        bidderAddress: userAddress,
        isBid: true,
      },
    });
    activeBids.forEach((bid) => {
      sendUserUpdate(userAddress, "bidUpdate", bid);
    });

    res.status(200).send("Updates sent successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
};

import { Response } from "express";
import { format } from "fast-csv";

import prisma from "@/common/prisma-client";
import { ERROR_RESPONSE } from "@/helpers/responseHelpers";
import { IDownloadsRequest } from "@/helpers/Interface";

export type CSVType = "TRANSACTIONS" | "PREFFERENCES";

// const getData = async (type: CSVType) => {
//   switch (type) {
//     case "PREFFERENCES":
//       return await prisma.userSettings.findMany();
//     default:
//       return [];
//   }
// };

// const getFileName = (type: CSVType) => {
//   switch (type) {
//     case "PREFFERENCES":
//       return "user-prefferences";
//     default:
//       return "";
//   }
// };

// const generateHeaders = (res: Response, filename: string) => {
//   res.setHeader("Content-Type", "text/csv");
//   res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
// };

export const sendCsv = async (_req: IDownloadsRequest, res: Response) => {
  try {
    // const { type } = req.query;

    // const data = await getData(type);
    const data = await prisma.userSettings.findMany();
    // const fileName = getFileName(type);

    // generateHeaders(res, fileName);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=data.csv");

    // Create CSV stream
    const csvStream = format({ headers: true });

    // Pipe to response
    csvStream.pipe(res);

    // Write data to stream
    data.forEach((record) => {
      csvStream.write({
        ID: record.id,
        privacyStatement: record.privacyStatement,
        termsAndConditions: record.termsAndConditions,
        accountVisibility: record.accountVisibility,
        updates: record.updates,
        maintenance: record.maintenance,
        marketing: record.marketing,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        userId: record.userId,
      });
    });

    // End the stream
    csvStream.end();
  } catch (error) {
    return ERROR_RESPONSE(res, false, 500, error.message);
  }
};

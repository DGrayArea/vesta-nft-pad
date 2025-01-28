import { Response } from "express";
import { SystemData, SystemDocTypes } from "@prisma/client";

import { HTTP_STATUS_CODE, REQUEST_METHOD } from "@/common/constants";
import { ISystemDocsRequest } from "@/helpers/Interface";
import prisma from "@/common/prisma-client";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/helpers/responseHelpers";

export const createSystemDocs = async (
  req: ISystemDocsRequest,
  res: Response
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { docs } = req.body as {
      docs?: { type: SystemDocTypes; url: string }[];
    };

    if (!docs || docs.length === 0)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        "Docs array is empty"
      );

    await prisma.systemDocs.createMany({
      data: [...docs],
    });

    const systemDocs = await prisma.systemDocs.findMany();

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      systemDocs,
      "System Docs Created Succesfully."
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

type Doc = { type: SystemDocTypes; url: string };

export const updateSystemDocs = async (
  req: ISystemDocsRequest,
  res: Response
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const { docs } = req.body as {
      docs?: Doc[];
    };

    if (!docs || docs.length === 0)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        "Docs array is empty"
      );

    const docTypes = docs.map((doc) => doc.type);

    const isExist = await Promise.all(
      docTypes.map((type) => prisma.systemDocs.count({ where: { type } }))
    );

    const toUpdate: Doc[] = [];
    const toCreate: Doc[] = [];

    isExist.map((n, i) =>
      n > 0 ? toUpdate.push(docs[i]) : toCreate.push(docs[i])
    );

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate
          .map((doc) => doc.type)
          .map((type, i) =>
            prisma.systemDocs.updateMany({
              where: {
                type,
              },
              data: {
                ...toUpdate[i],
              },
            })
          )
      );
    }

    if (toCreate.length > 0) {
      await prisma.systemDocs.createMany({ data: [...toCreate] });
    }

    const systemDocs = await prisma.systemDocs.findMany();

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      systemDocs,
      "System Docs Updated Succesfully."
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getSystemDocs = async (
  _req: ISystemDocsRequest,
  res: Response
) => {
  try {
    const systemDocs = await prisma.systemDocs.findMany();

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      systemDocs,
      "System Docs Retrieved Succesfully."
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const updateVestaFees = async (
  req: ISystemDocsRequest,
  res: Response
) => {
  try {
    const { vestaFee } = req.body as {
      docs?: { type: SystemDocTypes; url: string }[];
      vestaFee?: number;
    };

    const vestaFeeRecord = await prisma.systemData.findFirst({
      where: { type: "VESTA_FEE" },
    });

    let vestaFeeUpdated: SystemData;

    if (!vestaFeeRecord) {
      vestaFeeUpdated = await prisma.systemData.create({
        data: {
          type: "VESTA_FEE",
          vestaEarning: vestaFee,
        },
      });
    } else {
      vestaFeeUpdated = await prisma.systemData.update({
        where: {
          id: vestaFeeRecord.id,
        },
        data: {
          vestaEarning: vestaFee,
        },
      });
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      vestaFeeUpdated,
      "Vesta Fee Updated Succesfully."
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getVestaFees = async (_req: ISystemDocsRequest, res: Response) => {
  try {
    const vestaFee = await prisma.systemData.findFirst({
      where: {
        type: "VESTA_FEE",
      },
    });

    if (!vestaFee)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        "Vesta Fee Record Does Not Exist."
      );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      vestaFee,
      "Vesta Fee Retrieved Succesfully."
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

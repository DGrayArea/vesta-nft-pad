import { Handler } from "express";
import Joi, { SchemaMap } from "@hapi/joi";
import { HTTP_STATUS_CODE } from "../common/constants";
import { ERROR_RESPONSE } from "../helpers/responseHelpers";

type SuppertedKeys = "params" | "body" | "query";

interface Options {
  params?: SchemaMap;
  body?: SchemaMap;
  query?: SchemaMap;
}

interface ExpressJoiValidate {
  (schemaOptions: Options): Handler;
}

/**
 * Route validation using Joi
 * Takes a schema with properties defined using Joi:
 *  - params
 *  - body
 *  - query
 * Validates the request properties specified in the schema
 * @param {Object} schema { params, body, query }
 */

const validationSchemaMiddleware: ExpressJoiValidate =
  (schema) => (req, res, next) => {
    if (!schema) {
      return next();
    }

    const obj: Options = {};

    ["params", "body", "query"].forEach((key) => {
      const k: SuppertedKeys = key as SuppertedKeys;

      if (schema[k]) {
        obj[k] = req[k];
      }
    });

    const joiSchema = Joi.object(schema);
    const { error } = joiSchema.validate(obj);

    const valid = error == null;
    if (valid) {
      return next();
    } else {
      const { details } = error;
      const message = details.map((i) => i.message).join(",");

      return ERROR_RESPONSE(res, false, HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE, message);
    }
  };

export default validationSchemaMiddleware;
